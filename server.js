const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'evaluations.json');
const XLSX_FILE = path.join(__dirname, 'interview_schedule.xlsx');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// data 폴더 없으면 생성
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({"admin": "3035"}), 'utf-8');
}

app.use(express.static('public'));
app.use(express.json());

// Excel serial time → "HH:MM"
function excelTimeToStr(t) {
  const totalMinutes = Math.round(t * 24 * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// xlsx 데이터 파싱
function parseSchedule() {
  const wb = XLSX.readFile(XLSX_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const result = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length < 5) continue;

    const date = row[0] ? String(row[0]).trim() : '';
    const startTime = typeof row[1] === 'number' ? excelTimeToStr(row[1]) : String(row[1] || '').trim();
    const endTime   = typeof row[2] === 'number' ? excelTimeToStr(row[2]) : String(row[2] || '').trim();
    const applicant = row[3] ? String(row[3]).trim() : 'X';
    const judges    = row[4] ? String(row[4]).trim() : '';

    result.push({ date, startTime, endTime, applicant, judges });
  }
  return result;
}

// ── API ──────────────────────────────────────────────

// Auth APIs
app.post('/api/auth/check', (req, res) => {
  try {
    const { judgeName } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    res.json({ hasPassword: !!users[judgeName] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/setup', (req, res) => {
  try {
    const { judgeName, password } = req.body;
    if (!password || !/^\d{4}$/.test(password)) {
      return res.status(400).json({ error: "비밀번호는 4자리 숫자여야 합니다." });
    }
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    if (users[judgeName]) {
      return res.status(400).json({ error: "이미 비밀번호가 설정되어 있습니다." });
    }
    users[judgeName] = password;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { judgeName, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    if (users[judgeName] === password || (judgeName === 'admin' && users['admin'] === password)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/reset', (req, res) => {
  try {
    const { adminPassword, targetJudge } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    if (users['admin'] !== adminPassword) {
      return res.status(401).json({ error: "어드민 권한이 없습니다." });
    }
    delete users[targetJudge];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/evaluations/delete', (req, res) => {
  try {
    const { adminPassword, applicantName, judgeName } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    
    if (users['admin'] !== adminPassword) {
      return res.status(401).json({ error: "어드민 권한이 필요합니다." });
    }
    
    const allData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (allData[applicantName] && allData[applicantName][judgeName]) {
      delete allData[applicantName][judgeName];
      fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2), 'utf-8');
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "해당 데이터를 찾을 수 없습니다." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 면접 일정 전체 조회
app.get('/api/schedule', (req, res) => {
  try {
    const data = parseSchedule();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 평가지 전체 조회
app.get('/api/evaluations', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 평가지 저장 (면접자 이름 + 심사위원 이름 기준)
app.post('/api/evaluations/:name', (req, res) => {
  try {
    const applicantName = decodeURIComponent(req.params.name);
    const { judgeName, ...evalData } = req.body;
    
    if (!judgeName) {
      return res.status(400).json({ error: "심사위원 이름(judgeName)이 필요합니다." });
    }

    const allData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // 만약 기존 데이터가 있고, 그게 레거시(updatedAt이 최상위에 있음)라면 구조를 변경함
    if (allData[applicantName] && allData[applicantName].updatedAt) {
      // 레거시 데이터를 '기존 기록'으로 안전하게 이동
      const legacyData = { ...allData[applicantName] };
      // 만약 이미 judgeName 등으로 키가 나뉘어 있는 상태라면, updatedAt만 지워주면 됨
      // 하지만 updatedAt이 최상위에 있다는 것 자체가 레거시 구조이므로 래핑함
      const judgeKeys = Object.keys(legacyData).filter(k => legacyData[k] && typeof legacyData[k] === 'object' && legacyData[k].updatedAt);
      
      if (judgeKeys.length === 0) {
        // 완전 옛날 평면 구조인 경우
        allData[applicantName] = { "기존 기록": legacyData };
      } else {
        // 이미 좀 섞인 경우, 최상위 필드들(memo, opinion 등)을 제거하여 클린하게 유지
        // 여기서는 그냥 updatedAt만 제거해도 충분하지만, 더 안전하게 처리
        delete allData[applicantName].updatedAt;
        delete allData[applicantName].memo;
        delete allData[applicantName].opinion;
        delete allData[applicantName].customQA;
        delete allData[applicantName].passfail;
      }
    }

    if (!allData[applicantName] || typeof allData[applicantName] !== 'object') {
      allData[applicantName] = {};
    }
    
    allData[applicantName][judgeName] = { 
      ...allData[applicantName][judgeName], 
      ...evalData, 
      updatedAt: new Date().toISOString() 
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2), 'utf-8');
    res.json(allData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 특정 면접자 평가지 조회
app.get('/api/evaluations/:name', (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(data[name] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});

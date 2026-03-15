const fs = require('fs');
const applicantName = "테스트면접자";
const judgeName = "강승진";
const evalData = { memo: "좋은 평가", opinion: "합격" };

let allData = {
  "테스트면접자": {
    "memo": "옛날 메모",
    "updatedAt": "2026-03-15T00:00:00.000Z"
  }
};

if (allData[applicantName] && allData[applicantName].updatedAt) {
  const legacyData = { ...allData[applicantName] };
  const judgeKeys = Object.keys(legacyData).filter(k => legacyData[k] && typeof legacyData[k] === 'object' && !Array.isArray(legacyData[k]) && legacyData[k].updatedAt);
  
  if (judgeKeys.length === 0) {
    allData[applicantName] = { "기존 기록": legacyData };
  } else {
    delete allData[applicantName].updatedAt;
    delete allData[applicantName].memo;
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

console.log(JSON.stringify(allData, null, 2));

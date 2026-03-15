const PDFParser = require("pdf2json");
const pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
  console.log(pdfParser.getRawTextContent());
});
pdfParser.loadPDF("2026 \uC0C1\uBC18\uAE30 \uC2E0\uC785\uBD80\uC6D0 \uBA74\uC811 \uC9C8\uBB38\uC9C0.pdf");

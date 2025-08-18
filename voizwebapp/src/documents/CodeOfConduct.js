import React from 'react';

const CodeOfConduct = () => {
  const pdfUrl = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Voiz-Code_of_Conduct.pdf";

  return (
    <div className="pdf-viewer">
      {/* Embed PDF directly using an iframe */}
      <iframe
        src={pdfUrl}
        title="Voiz_Code_of_Conduct"
        width="100%"
        height="1000px"
      />
    </div>
  );
};

export default CodeOfConduct;

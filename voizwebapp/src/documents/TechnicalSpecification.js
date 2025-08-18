import React from 'react';

const TechnicalSpecification = () => {
  const pdfUrl = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Voiz-Technical_Specification.pdf";

  return (
    <div className="pdf-viewer">
      {/* Embed PDF directly using an iframe */}
      <iframe
        src={pdfUrl}
        title="Voiz_Technical Specification"
        width="100%"
        height="1000px"
      />
    </div>
  );
};

export default TechnicalSpecification;

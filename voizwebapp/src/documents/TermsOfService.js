import React from 'react';

const TermsOfService = () => {
  const pdfUrl = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Voiz_Terms_Of_Service.pdf";

  return (
    <div className="pdf-viewer">
      <iframe
        src={pdfUrl}
        title="Terms of Service"
        width="100%"
        height="1000px"
      />
    </div>
  );
};

export default TermsOfService;
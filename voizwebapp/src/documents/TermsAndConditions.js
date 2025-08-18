import React from 'react';

const TermsAndConditions = () => {
  const pdfUrl = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Voiz-Standard_Terms_Music_License_Agreement.pdf";

  return (
    <div className="pdf-viewer">
      {/* Embed PDF directly using an iframe */}
      <iframe
        src={pdfUrl}
        title="Voiz_Standard Terms_Music License Agreement"
        width="100%"
        height="750px"
      />
    </div>
  );
};

export default TermsAndConditions;

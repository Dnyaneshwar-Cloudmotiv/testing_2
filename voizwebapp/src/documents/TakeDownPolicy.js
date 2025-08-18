import React from 'react';

const TakeDownPolicy = () => {
  const pdfUrl = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Voiz_Takedown_Policy.pdf";

  return (
    <div className="pdf-viewer">
      <iframe
        src={pdfUrl}
        title="Take Down Policy"
        width="100%"
        height="1000px"
      />
    </div>
  );
};

export default TakeDownPolicy;
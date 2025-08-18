import React from 'react';

const PrivacyPolicy = () => {
  const pdfUrl = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Voiz_Privacy_Policy.pdf";

  return (
    <div className="pdf-viewer">
      <iframe
        src={pdfUrl}
        title="Privacy Policy"
        width="100%"
        height="1000px"
      />
    </div>
  );
};

export default PrivacyPolicy;
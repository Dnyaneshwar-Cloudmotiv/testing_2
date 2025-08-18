import React from 'react';

const CookiesPolicy = () => {
  const pdfUrl = "https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Voiz_Cookies_Policy.pdf";

  return (
    <div className="pdf-viewer">
      <iframe
        src={pdfUrl}
        title="Cookies Policy"
        width="100%"
        height="1000px"
      />
    </div>
  );
};

export default CookiesPolicy;
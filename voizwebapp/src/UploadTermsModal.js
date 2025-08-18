import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  Box,
  Link,
  Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import './UploadTermsModal.css';

const UploadTermsModal = ({ open, onClose, onUpload, songCount, isUploading }) => {
  const [checkboxes, setCheckboxes] = useState({
    terms: false,
    conduct: false,
    copyright: false,
  });

  const allChecked = checkboxes.terms && checkboxes.conduct && checkboxes.copyright;

  const handleCheckboxChange = (event) => {
    setCheckboxes({
      ...checkboxes,
      [event.target.name]: event.target.checked,
    });
  };

  useEffect(() => {
    if (!open) {
      setCheckboxes({
        terms: false,
        conduct: false,
        copyright: false,
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={isUploading ? () => {} : onClose} PaperProps={{ className: 'upload-terms-dialog' }}>
      <DialogContent className="upload-terms-content">
        <Typography variant="h1" className="upload-terms-title">
          Upload {songCount} Songs
        </Typography>
        <Box className="upload-terms-body-container">
          <Typography className="upload-terms-subtitle">
            Please accept the following terms
            <br />
            before uploading:
          </Typography>
          <Box className="upload-terms-checkboxes">
            <FormControlLabel
              control={<Checkbox disabled={isUploading} checked={checkboxes.terms} onChange={handleCheckboxChange} name="terms" className="upload-terms-checkbox" />}
              label={
                <Typography className="upload-terms-label">
                  I've read and agreed to the
                  <br />
                  <Link href="https://voiz.co.in/standard-terms-and-conditions-artist/" target="_blank" rel="noopener noreferrer" className="upload-terms-link">
                    terms and conditions
                  </Link>
                </Typography>
              }
            />
            <FormControlLabel
              control={<Checkbox disabled={isUploading} checked={checkboxes.conduct} onChange={handleCheckboxChange} name="conduct" className="upload-terms-checkbox" />}
              label={
                <Typography className="upload-terms-label">
                  Content uploaded meets the
                  <br />
                  <Link href="https://voiz.co.in/code-of-conduct/" target="_blank" rel="noopener noreferrer" className="upload-terms-link">
                    platform Code of Conduct
                  </Link>
                </Typography>
              }
            />
            <FormControlLabel
              control={<Checkbox disabled={isUploading} checked={checkboxes.copyright} onChange={handleCheckboxChange} name="copyright" className="upload-terms-checkbox" />}
              label={<Typography className="upload-terms-label">Content doesn't infringe others copyrights</Typography>}
            />
          </Box>
        </Box>
        <Divider className="upload-terms-divider" />
        <Box className="upload-terms-actions">
          <Button onClick={onClose} className="upload-terms-cancel-btn" disabled={isUploading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={onUpload}
            disabled={!allChecked}
            className="upload-terms-upload-btn"
            loading={isUploading}
          >
            Upload
          </LoadingButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UploadTermsModal;

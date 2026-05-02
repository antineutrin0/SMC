import React, { useState } from "react";
import { Button } from "../ui/button";

const ImageUpload = ({ onUpload }) => {
  const [image, setImage] = useState(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = async () => {
    if (!image) return;

    setUploading(true);
    setUploaded(false);

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "SMC_Files");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dxmtx15xs/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      const imageUrl = data.secure_url;

      setUrl(imageUrl);
      setUploaded(true);

      if (onUpload) {
        onUpload(imageUrl);
      }

    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  // when user selects a new file → reset state
  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
    setUploaded(false);
    setUrl("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>Upload Image</h3>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input type="file" onChange={handleFileChange} />

        <Button
          onClick={handleUpload}
          disabled={!image || uploading}
          style={{
            backgroundColor: uploaded ? "green" : "",
            color: uploaded ? "white" : "",
          }}
        >
          {uploading
            ? "Uploading..."
            : uploaded
            ? "Uploaded"
            : "Upload"}
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;
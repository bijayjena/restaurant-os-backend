# File Upload Testing Guide

## Quick Start

### 1. Using cURL (Recommended for Testing)

**Upload Menu Item Image:**
```bash
curl -X POST \
  http://localhost:3000/api/storage/menu-items/YOUR_MENU_ITEM_ID/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@./path/to/image.jpg"
```

**Upload Tenant Logo:**
```bash
curl -X POST \
  http://localhost:3000/api/storage/tenants/YOUR_TENANT_ID/logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@./path/to/logo.png"
```

**Delete Menu Item Image:**
```bash
curl -X DELETE \
  http://localhost:3000/api/storage/menu-items/YOUR_MENU_ITEM_ID/image \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Access Uploaded File:**
```bash
curl http://localhost:3000/uploads/menu-items/menu-item-123-abc.jpg -o downloaded-image.jpg
```

---

## 2. Using Postman

### Upload File:
1. Create new POST request
2. URL: `http://localhost:3000/api/storage/menu-items/{id}/image`
3. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
4. Body:
   - Select "form-data"
   - Add key: `file`
   - Change type to "File"
   - Click "Select Files" and choose your image
5. Send

### Delete File:
1. Create new DELETE request
2. URL: `http://localhost:3000/api/storage/menu-items/{id}/image`
3. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
4. Send

---

## 3. Using JavaScript/Frontend

### Vanilla JavaScript:
```javascript
async function uploadImage(menuItemId, file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `http://localhost:3000/api/storage/menu-items/${menuItemId}/image`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  try {
    const result = await uploadImage('menu-item-id', file, 'your-token');
    console.log('Uploaded:', result.url);
  } catch (error) {
    console.error('Error:', error);
  }
});
```

### React Component:
```jsx
import { useState } from 'react';

function ImageUploader({ menuItemId, token }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `http://localhost:3000/api/storage/menu-items/${menuItemId}/image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageUrl && (
        <img
          src={`http://localhost:3000${imageUrl}`}
          alt="Uploaded"
          style={{ maxWidth: '200px' }}
        />
      )}
    </div>
  );
}
```

### Axios Example:
```javascript
import axios from 'axios';

async function uploadImage(menuItemId, file, token) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(
      `http://localhost:3000/api/storage/menu-items/${menuItemId}/image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    throw error;
  }
}
```

---

## 4. File Validation

### Client-Side Validation (Recommended):
```javascript
function validateFile(file) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
}

// Usage
const file = fileInput.files[0];
const validation = validateFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

---

## 5. Complete HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>File Upload Test</title>
</head>
<body>
  <h1>Menu Item Image Upload</h1>
  
  <form id="uploadForm">
    <input type="text" id="menuItemId" placeholder="Menu Item ID" required>
    <input type="text" id="token" placeholder="Auth Token" required>
    <input type="file" id="fileInput" accept="image/*" required>
    <button type="submit">Upload</button>
  </form>

  <div id="result"></div>
  <div id="preview"></div>

  <script>
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const menuItemId = document.getElementById('menuItemId').value;
      const token = document.getElementById('token').value;
      const file = document.getElementById('fileInput').files[0];
      const resultDiv = document.getElementById('result');
      const previewDiv = document.getElementById('preview');

      if (!file) {
        resultDiv.innerHTML = '<p style="color: red;">Please select a file</p>';
        return;
      }

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        resultDiv.innerHTML = '<p style="color: red;">File too large (max 5MB)</p>';
        return;
      }

      resultDiv.innerHTML = '<p>Uploading...</p>';

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `http://localhost:3000/api/storage/menu-items/${menuItemId}/image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (response.ok) {
          resultDiv.innerHTML = `
            <p style="color: green;">Upload successful!</p>
            <p>URL: ${data.url}</p>
          `;
          previewDiv.innerHTML = `
            <img src="http://localhost:3000${data.url}" 
                 alt="Uploaded" 
                 style="max-width: 300px; margin-top: 20px;">
          `;
        } else {
          resultDiv.innerHTML = `<p style="color: red;">Error: ${data.message}</p>`;
        }
      } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
      }
    });
  </script>
</body>
</html>
```

---

## 6. Testing Checklist

- [ ] Upload valid JPEG image (< 5MB)
- [ ] Upload valid PNG image (< 5MB)
- [ ] Upload valid WebP image (< 5MB)
- [ ] Try to upload file > 5MB (should fail)
- [ ] Try to upload PDF file (should fail)
- [ ] Try to upload without authentication (should fail)
- [ ] Try to upload as Waiter role (should fail)
- [ ] Upload image, then upload another (old should be deleted)
- [ ] Delete uploaded image
- [ ] Access uploaded image via URL
- [ ] Upload tenant logo
- [ ] Delete tenant logo

---

## 7. Common Issues

### Issue: "No file provided"
**Solution:** Make sure the form field name is exactly `file`

### Issue: "File size exceeds 5MB limit"
**Solution:** Compress your image or use a smaller file

### Issue: "Invalid file type"
**Solution:** Only use JPEG, PNG, or WebP images

### Issue: 403 Forbidden
**Solution:** Make sure you're using Owner or Manager token

### Issue: 404 Not Found
**Solution:** Verify the menu item or tenant ID exists

### Issue: CORS error
**Solution:** Backend already has CORS enabled, check your frontend URL

---

## 8. Production Deployment

When deploying to production:

1. **Use Cloud Storage:**
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage

2. **Add CDN:**
   - CloudFront (AWS)
   - Cloud CDN (Google)
   - Azure CDN

3. **Implement:**
   - Image optimization/resizing
   - Virus scanning
   - Rate limiting
   - Backup strategy

4. **Update URLs:**
   - Change from `/uploads/...` to CDN URLs
   - Update CORS settings

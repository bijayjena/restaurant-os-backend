# Phase 4: File Upload Module - Complete ✅

## What's Been Implemented

### 1. Storage Service

**Location:** `src/storage/storage.service.ts`

**Features:**
- File validation (size, type)
- Automatic directory creation
- Unique filename generation
- Old file cleanup on replacement
- Tenant isolation

**Configuration:**
- Max file size: 5MB
- Allowed types: JPEG, JPG, PNG, WebP
- Upload directory: `uploads/`
- Subdirectories: `menu-items/`, `tenants/`

### 2. Storage Controller

**Location:** `src/storage/storage.controller.ts`

**Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/storage/menu-items/:id/image` | Owner, Manager | Upload menu item image |
| POST | `/storage/tenants/:id/logo` | Owner, Manager | Upload tenant logo |
| DELETE | `/storage/menu-items/:id/image` | Owner, Manager | Delete menu item image |
| DELETE | `/storage/tenants/:id/logo` | Owner, Manager | Delete tenant logo |

### 3. File Validation

**Size Validation:**
- Maximum: 5MB (5,242,880 bytes)
- Error: "File size exceeds 5MB limit"

**Type Validation:**
- Allowed: image/jpeg, image/jpg, image/png, image/webp
- Error: "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp"

**Existence Validation:**
- Error: "No file provided"

### 4. File Storage Structure

```
uploads/
├── menu-items/
│   ├── menu-item-1234567890-abc123.jpg
│   ├── menu-item-1234567891-def456.png
│   └── ...
└── tenants/
    ├── tenant-logo-1234567890-ghi789.jpg
    ├── tenant-logo-1234567891-jkl012.png
    └── ...
```

### 5. Filename Generation

**Format:** `{prefix}-{timestamp}-{random}.{ext}`

**Example:**
- Original: `pizza.jpg`
- Generated: `menu-item-1709567890123-x7k9m2p4q.jpg`

**Benefits:**
- Unique filenames (no collisions)
- Sortable by timestamp
- Preserves file extension
- Prevents path traversal attacks

### 6. Static File Serving

**Configuration:**
- Files served from: `/uploads/*`
- Physical location: `{project-root}/uploads/`
- Automatic MIME type detection

**Example URLs:**
```
http://localhost:3000/uploads/menu-items/menu-item-123-abc.jpg
http://localhost:3000/uploads/tenants/tenant-logo-456-def.png
```

### 7. Security Features

✅ **Tenant Isolation**
- Users can only upload files for their own tenant
- Cross-tenant uploads blocked

✅ **Role-Based Access**
- Only Owner and Manager can upload/delete files
- Kitchen and Waiter cannot modify files

✅ **File Validation**
- Size limits prevent DoS attacks
- Type restrictions prevent malicious uploads
- Filename sanitization prevents path traversal

✅ **Old File Cleanup**
- Automatically deletes old file when uploading new one
- Prevents disk space waste
- Maintains data consistency

---

## Usage Examples

### 1. Upload Menu Item Image

**Request:**
```http
POST /api/storage/menu-items/uuid-here/image
Authorization: Bearer <owner-or-manager-token>
Content-Type: multipart/form-data

file: [binary image data]
```

**Response (200 OK):**
```json
{
  "message": "Image uploaded successfully",
  "url": "/uploads/menu-items/menu-item-1709567890123-x7k9m2p4q.jpg"
}
```

**cURL Example:**
```bash
curl -X POST \
  http://localhost:3000/api/storage/menu-items/uuid-here/image \
  -H "Authorization: Bearer your-token" \
  -F "file=@/path/to/image.jpg"
```

### 2. Upload Tenant Logo

**Request:**
```http
POST /api/storage/tenants/uuid-here/logo
Authorization: Bearer <owner-or-manager-token>
Content-Type: multipart/form-data

file: [binary image data]
```

**Response (200 OK):**
```json
{
  "message": "Logo uploaded successfully",
  "url": "/uploads/tenants/tenant-logo-1709567890456-y8l0n3q5r.png"
}
```

### 3. Delete Menu Item Image

**Request:**
```http
DELETE /api/storage/menu-items/uuid-here/image
Authorization: Bearer <owner-or-manager-token>
```

**Response (204 No Content):**
```
(empty body)
```

### 4. Delete Tenant Logo

**Request:**
```http
DELETE /api/storage/tenants/uuid-here/logo
Authorization: Bearer <owner-or-manager-token>
```

**Response (204 No Content):**
```
(empty body)
```

### 5. Access Uploaded File

**Request:**
```http
GET /uploads/menu-items/menu-item-1709567890123-x7k9m2p4q.jpg
```

**Response:**
```
[Binary image data with appropriate Content-Type header]
```

---

## Error Responses

### 400 Bad Request - File Too Large
```json
{
  "statusCode": 400,
  "message": "File size exceeds 5MB limit",
  "error": "Bad Request"
}
```

### 400 Bad Request - Invalid File Type
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp",
  "error": "Bad Request"
}
```

### 400 Bad Request - No File
```json
{
  "statusCode": 400,
  "message": "No file provided",
  "error": "Bad Request"
}
```

### 400 Bad Request - Cross-Tenant Upload
```json
{
  "statusCode": 400,
  "message": "Cannot upload image for menu item from different tenant",
  "error": "Bad Request"
}
```

### 403 Forbidden - Insufficient Role
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: owner, manager. Your role: waiter",
  "error": "Forbidden"
}
```

### 404 Not Found - Resource Not Found
```json
{
  "statusCode": 404,
  "message": "Menu item not found",
  "error": "Not Found"
}
```

---

## Integration with Entities

### Menu Item Entity
```typescript
@Entity('menu_items')
export class MenuItem {
  // ...
  @Column({ nullable: true })
  image: string | null;  // Stores URL like "/uploads/menu-items/..."
  // ...
}
```

### Tenant Entity
```typescript
@Entity('tenants')
export class Tenant {
  // ...
  @Column({ nullable: true })
  logo: string | null;  // Stores URL like "/uploads/tenants/..."
  // ...
}
```

---

## Frontend Integration

### Using Fetch API

```javascript
async function uploadMenuItemImage(menuItemId, file) {
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
  return data.url;
}
```

### Using Axios

```javascript
async function uploadTenantLogo(tenantId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `/api/storage/tenants/${tenantId}/logo`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.url;
}
```

### React Example

```jsx
function MenuItemImageUpload({ menuItemId }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadMenuItemImage(menuItemId, file);
      console.log('Uploaded:', url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

---

## Testing

Use `test-phase4-upload.http` to test file upload endpoints.

**Note:** REST Client extension doesn't support file uploads well. Use:
- Postman
- Insomnia
- cURL
- Frontend form

---

## Production Considerations

### Current Implementation (Development)
- Files stored on local filesystem
- Served directly by NestJS

### Recommended for Production
- Use cloud storage (AWS S3, Google Cloud Storage, Azure Blob)
- Use CDN for file delivery
- Implement image optimization/resizing
- Add virus scanning
- Implement rate limiting on uploads

### Migration Path
1. Keep current implementation for development
2. Create abstraction layer (interface)
3. Implement cloud storage provider
4. Switch via environment variable

---

## Configuration

### Environment Variables

Add to `.env`:
```env
# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/webp
UPLOAD_DIR=uploads
```

### Customization

To change limits, modify `src/storage/storage.service.ts`:

```typescript
private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
private readonly allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',  // Add GIF support
];
```

---

## Next Steps

Ready for Phase 5? Confirm to proceed with:
- Global Exception Filter
- Logging Interceptor
- Swagger/OpenAPI Documentation
- Rate Limiting
- Basic Caching
- Production Improvements

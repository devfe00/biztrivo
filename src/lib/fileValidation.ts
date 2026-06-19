// src/lib/fileValidation.ts
// Validação de arquivos de imagem antes do upload (evita SVG/scripts disfarçados e arquivos gigantes).

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Formato não permitido. Envie apenas PNG, JPEG ou WEBP.' };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, error: 'Imagem muito grande. O limite é 5MB.' };
  }
  return { ok: true };
}

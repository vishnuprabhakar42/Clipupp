package com.couponvalley.media.api;

import com.couponvalley.media.application.MediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@Tag(name = "media", description = "File upload to Cloudflare R2")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Upload an image",
            description = "Uploads a JPEG/PNG/WebP/GIF/SVG file (max 10 MB) to Cloudflare R2 and returns its public URL. " +
                    "In dev mode without R2 configured, returns a placehold.co placeholder URL.")
    public ResponseEntity<UploadResponse> upload(@RequestParam("file") MultipartFile file) {
        String url = mediaService.upload(file);
        return ResponseEntity.ok(new UploadResponse(url));
    }

    public record UploadResponse(String url) {}
}

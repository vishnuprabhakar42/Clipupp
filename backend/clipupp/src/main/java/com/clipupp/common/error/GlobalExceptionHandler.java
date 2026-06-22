package com.clipupp.common.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.net.URI;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Translates exceptions into RFC 7807 problem+json responses with stable
 * {@link ErrorCode} values that frontend code branches on.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String DOCS_BASE = "https://docs.clipupp.com/errors/";

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetail> handleApi(ApiException ex, HttpServletRequest req) {
        return build(ex.getStatus(), ex.getCode(), ex.getStatus().getReasonPhrase(), ex.getDetail(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<FieldErrorDto> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new FieldErrorDto(
                        fe.getField(),
                        fe.getCode() != null ? fe.getCode() : "INVALID",
                        fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"))
                .toList();
        ResponseEntity<ProblemDetail> response = build(HttpStatus.UNPROCESSABLE_ENTITY,
                ErrorCode.VALIDATION_FAILED, "Validation failed",
                "One or more fields are invalid", req);
        response.getBody().setProperty("errors", errors);
        return response;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
        List<FieldErrorDto> errors = ex.getConstraintViolations().stream()
                .map(GlobalExceptionHandler::toFieldError)
                .toList();
        ResponseEntity<ProblemDetail> response = build(HttpStatus.UNPROCESSABLE_ENTITY,
                ErrorCode.VALIDATION_FAILED, "Validation failed",
                "One or more fields are invalid", req);
        response.getBody().setProperty("errors", errors);
        return response;
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ProblemDetail> handleMalformed(Exception ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST, "Malformed request",
                ex.getMessage(), req);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ProblemDetail> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ErrorCode.METHOD_NOT_ALLOWED, "Method not allowed",
                ex.getMessage(), req);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuth(AuthenticationException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Unauthorized",
                "Authentication is required to access this resource", req);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, "Forbidden",
                "You do not have permission to perform this action", req);
    }

    /** Multipart payload over the configured size limit (Spring throws before
     *  the controller runs). 413 with the actual size in the body. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ProblemDetail> handleUploadTooLarge(MaxUploadSizeExceededException ex,
                                                              HttpServletRequest req) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, ErrorCode.VALIDATION_FAILED, "Upload too large",
                "File exceeds the upload size limit. " + ex.getMessage(), req);
    }

    /** Validation errors thrown manually from service code (e.g. unsupported
     *  file type, empty file). 400 with the actual message so the UI can show
     *  it to the user. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArg(IllegalArgumentException ex,
                                                          HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, "Invalid request",
                ex.getMessage(), req);
    }

    /** External-service / configuration failures (R2 auth, missing bucket,
     *  etc.). Surface the real reason in the response so misconfig is
     *  diagnosable from the client without trawling Railway logs. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ProblemDetail> handleIllegalState(IllegalStateException ex,
                                                            HttpServletRequest req) {
        log.error("Service error on {} {}: {}", req.getMethod(), req.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL, "Service error",
                ex.getMessage(), req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception on {} {}", req.getMethod(), req.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL, "Internal server error",
                "An unexpected error occurred. Please try again or contact support if the problem persists.", req);
    }

    private static ResponseEntity<ProblemDetail> build(HttpStatus status, String code, String title,
                                                       String detail, HttpServletRequest req) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, detail);
        body.setTitle(title);
        body.setType(URI.create(DOCS_BASE + code.toLowerCase().replace('_', '-')));
        body.setInstance(URI.create(req.getRequestURI()));
        body.setProperty("code", code);
        String traceId = MDC.get("traceId");
        if (traceId != null) {
            body.setProperty("traceId", traceId);
        }
        return ResponseEntity.status(status).body(body);
    }

    private static FieldErrorDto toFieldError(ConstraintViolation<?> v) {
        String field = v.getPropertyPath() == null ? "" : v.getPropertyPath().toString();
        String code = v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName();
        return new FieldErrorDto(field, code, v.getMessage());
    }
}

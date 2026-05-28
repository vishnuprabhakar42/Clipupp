package com.clipupp.admin.api;

import com.clipupp.newsletter.domain.NewsletterStatus;
import com.clipupp.newsletter.domain.NewsletterSubscription;
import com.clipupp.newsletter.infra.NewsletterSubscriptionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/newsletter")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/newsletter", description = "Newsletter subscriber list + CSV export")
public class AdminNewsletterController {

    private final NewsletterSubscriptionRepository repo;

    public AdminNewsletterController(NewsletterSubscriptionRepository repo) {
        this.repo = repo;
    }

    public record SubscriberRow(String id, String email, String locale, String status,
                                String createdAt, String confirmedAt) {
        static SubscriberRow from(NewsletterSubscription s) {
            return new SubscriberRow(
                    s.getId().toString(),
                    s.getEmail(),
                    s.getLocale(),
                    s.getStatus().name(),
                    s.getCreatedAt().toString(),
                    s.getConfirmedAt() == null ? null : s.getConfirmedAt().toString());
        }
    }

    @GetMapping(value = "/subscribers", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Paginated subscriber list")
    public Page<SubscriberRow> subscribers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) NewsletterStatus status) {
        int pageSize = Math.max(1, Math.min(size, 500));
        Page<NewsletterSubscription> result = status == null
                ? repo.findAll(PageRequest.of(page, pageSize))
                : repo.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, pageSize));
        return result.map(SubscriberRow::from);
    }

    @GetMapping(value = "/subscribers.csv", produces = "text/csv")
    @Operation(summary = "CSV export — confirmed subscribers only")
    public ResponseEntity<String> csvExport() {
        List<NewsletterSubscription> rows = repo.findByStatusOrderByCreatedAtDesc(
                NewsletterStatus.CONFIRMED, PageRequest.of(0, 50_000)).getContent();
        StringWriter sw = new StringWriter(rows.size() * 80 + 64);
        try (PrintWriter pw = new PrintWriter(sw)) {
            pw.println("email,locale,confirmed_at,subscription_id");
            for (NewsletterSubscription s : rows) {
                pw.printf("%s,%s,%s,%s%n",
                        csv(s.getEmail()),
                        csv(s.getLocale()),
                        csv(s.getConfirmedAt() == null ? "" : s.getConfirmedAt().toString()),
                        csv(s.getId().toString()));
            }
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"newsletter-subscribers.csv\"")
                .body(sw.toString());
    }

    private static String csv(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}

package com.couponvalley.common.pagination;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/**
 * Standard list response envelope. Cursor-based by default; offset-based
 * pages from Spring Data are wrapped here with {@code nextCursor} synthesized
 * from the page number for admin endpoints that prefer offset pagination.
 *
 * <p>Public catalog endpoints use {@link CursorEncoder} to mint opaque
 * cursors over (sort key, id) so pagination is stable under inserts.
 */
public record CursorPage<T>(List<T> data, PageInfo page) {

    public record PageInfo(String nextCursor, boolean hasMore, int limit) {}

    public static <T, R> CursorPage<R> from(Page<T> page, Function<T, R> mapper) {
        List<R> mapped = page.getContent().stream().map(mapper).toList();
        boolean hasMore = page.hasNext();
        String nextCursor = hasMore
                ? CursorEncoder.encode(new CursorEncoder.OffsetCursor(page.getNumber() + 1))
                : null;
        return new CursorPage<>(mapped, new PageInfo(nextCursor, hasMore, page.getSize()));
    }

    public static <T> CursorPage<T> of(List<T> data, int limit) {
        return new CursorPage<>(data, new PageInfo(null, false, limit));
    }
}

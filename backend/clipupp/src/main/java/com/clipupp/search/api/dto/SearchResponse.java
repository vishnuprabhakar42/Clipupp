package com.clipupp.search.api.dto;

import com.clipupp.search.application.SearchService;
import com.clipupp.search.infra.SearchRepository.SearchHit;
import java.util.List;

public record SearchResponse(
        List<HitDto> stores,
        List<HitDto> coupons,
        List<HitDto> categories
) {
    public static SearchResponse from(SearchService.SearchResult r) {
        return new SearchResponse(
                r.stores().stream().map(HitDto::from).toList(),
                r.coupons().stream().map(HitDto::from).toList(),
                r.categories().stream().map(HitDto::from).toList());
    }

    public record HitDto(String id, String slug, String title, String snippet,
                         String imageUrl, String kind, double rank) {
        public static HitDto from(SearchHit h) {
            return new HitDto(h.id(), h.slug(), h.title(), h.snippet(),
                    h.imageUrl(), h.kind(), h.rank());
        }
    }
}

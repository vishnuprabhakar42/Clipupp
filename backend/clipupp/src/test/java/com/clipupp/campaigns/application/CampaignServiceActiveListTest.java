package com.clipupp.campaigns.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.clipupp.campaigns.domain.Campaign;
import com.clipupp.campaigns.infra.CampaignRepository;
import com.clipupp.common.audit.AuditLogService;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;

class CampaignServiceActiveListTest {

    private final CampaignRepository repo = mock(CampaignRepository.class);
    private final CampaignService service = new CampaignService(repo, mock(AuditLogService.class));

    @Test
    void findActiveLimitDelegatesWithPageSize() {
        OffsetDateTime now = OffsetDateTime.now();
        Campaign a = Campaign.create("bbd", "Big Billion Days", now.minusDays(1), now.plusDays(5));
        Campaign b = Campaign.create("gif", "Great Indian Festival", now.minusDays(2), now.plusDays(5));
        when(repo.findActiveAt(any(OffsetDateTime.class), any(Pageable.class))).thenReturn(List.of(a, b));

        List<Campaign> out = service.findActive(2);

        assertThat(out).containsExactly(a, b);
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(repo).findActiveAt(any(OffsetDateTime.class), page.capture());
        assertThat(page.getValue().getPageSize()).isEqualTo(2);
    }

    @Test
    void findActiveLimitIsClampedToTen() {
        when(repo.findActiveAt(any(OffsetDateTime.class), any(Pageable.class))).thenReturn(List.of());
        service.findActive(50);
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(repo).findActiveAt(any(OffsetDateTime.class), page.capture());
        assertThat(page.getValue().getPageSize()).isEqualTo(10);
    }

    @Test
    void singleActiveCampaignTakesNewestWhenSeveralOverlap() {
        OffsetDateTime now = OffsetDateTime.now();
        Campaign newest = Campaign.create("bbd", "Big Billion Days", now.minusDays(1), now.plusDays(5));
        Campaign older = Campaign.create("gif", "Great Indian Festival", now.minusDays(2), now.plusDays(5));
        when(repo.findActiveAt(any(OffsetDateTime.class), any(Pageable.class))).thenReturn(List.of(newest, older));

        assertThat(service.findActive()).isSameAs(newest);
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(repo).findActiveAt(any(OffsetDateTime.class), page.capture());
        assertThat(page.getValue().getPageSize()).isEqualTo(1);
    }

    @Test
    void singleActiveCampaignIsNullWhenNoneRunning() {
        when(repo.findActiveAt(any(OffsetDateTime.class), any(Pageable.class))).thenReturn(List.of());
        assertThat(service.findActive()).isNull();
    }
}

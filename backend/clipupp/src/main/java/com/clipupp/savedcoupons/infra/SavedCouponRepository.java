package com.clipupp.savedcoupons.infra;

import com.clipupp.savedcoupons.domain.SavedCoupon;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedCouponRepository extends JpaRepository<SavedCoupon, SavedCoupon.Pk> {

    @Query("select s from SavedCoupon s where s.id.userId = :userId order by s.savedAt desc")
    Page<SavedCoupon> findByUser(@Param("userId") UUID userId, Pageable pageable);

    @Modifying
    @Query("delete from SavedCoupon s where s.id.userId = :userId and s.id.couponId = :couponId")
    int deleteByUserAndCoupon(@Param("userId") UUID userId, @Param("couponId") UUID couponId);
}

package com.couponvalley.users.infra;

import com.couponvalley.users.domain.UserPreference;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreference, UUID> {
}

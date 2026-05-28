package com.clipupp.common.reference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "region")
public class Region {

    @Id
    @Column(name = "code", length = 2, nullable = false, updatable = false)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "currency_code", length = 3, nullable = false)
    private String currencyCode;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    protected Region() {}

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getCurrencyCode() { return currencyCode; }
    public boolean isActive() { return active; }
}

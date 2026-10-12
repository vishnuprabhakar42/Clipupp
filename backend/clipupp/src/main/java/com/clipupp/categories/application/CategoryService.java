package com.clipupp.categories.application;

import com.clipupp.categories.domain.Category;
import com.clipupp.categories.infra.CategoryRepository;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.text.Slugifier;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository repo;
    private final AuditLogService audit;

    public CategoryService(CategoryRepository repo, AuditLogService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public Optional<Category> findBySlug(String slug) {
        return repo.findBySlug(slug);
    }

    @Transactional(readOnly = true)
    public List<Category> listForAdmin() {
        return repo.findAllForAdmin();
    }

    @Transactional(readOnly = true)
    public Category findForAdmin(UUID id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("Category not found"));
    }

    @Transactional(readOnly = true)
    public List<Category> findFeatured() {
        return repo.findFeatured();
    }

    @Transactional(readOnly = true)
    public List<Category> activeRoots() {
        return repo.findActiveRoots();
    }

    @CacheEvict(cacheNames = {"category.tree", "homepage.layout"}, allEntries = true)
    @Transactional
    public void setFeatured(List<SlugPosition> assignments) {
        for (Category c : repo.findFeatured()) {
            c.setFeatured(false);
            c.setFeaturedPosition(null);
        }
        if (assignments == null || assignments.isEmpty()) return;
        for (SlugPosition a : assignments) {
            repo.findBySlug(a.slug()).ifPresent(c -> {
                c.setFeatured(true);
                c.setFeaturedPosition(a.position());
            });
        }
        audit.record("CATEGORIES_FEATURED_SET", "category", null,
                Map.of("count", assignments.size()));
    }

    public record SlugPosition(String slug, int position) {}

    /** Builds a flat list of all active categories. Cached for 10 min. */
    @Cacheable(cacheNames = "category.tree", key = "'all'")
    @Transactional(readOnly = true)
    public List<TreeNode> tree() {
        List<Category> all = repo.findAllActive();
        Map<UUID, List<TreeNode>> byParent = new HashMap<>();
        Map<UUID, TreeNode> nodes = new HashMap<>();
        for (Category c : all) {
            TreeNode n = new TreeNode(c.getId(), c.getSlug(), c.getTitle(), c.getIcon(),
                    c.getDescription(), new ArrayList<>());
            nodes.put(c.getId(), n);
            byParent.computeIfAbsent(c.getParentId(), k -> new ArrayList<>()).add(n);
        }
        for (Map.Entry<UUID, List<TreeNode>> e : byParent.entrySet()) {
            if (e.getKey() == null) continue;
            TreeNode parent = nodes.get(e.getKey());
            if (parent != null) parent.children.addAll(e.getValue());
        }
        List<TreeNode> roots = byParent.getOrDefault(null, List.of());
        return List.copyOf(roots);
    }

    @CacheEvict(cacheNames = {"category.tree", "homepage.layout"}, allEntries = true)
    @Transactional
    public Category create(String title, String slug, UUID parentId, String icon, String description,
                           short position, String metaTitle, String metaDescription) {
        String finalSlug = (slug == null || slug.isBlank()) ? Slugifier.slugify(title) : Slugifier.slugify(slug);
        if (finalSlug.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_SLUG", "Cannot derive a slug from the title");
        }
        if (repo.existsBySlug(finalSlug)) {
            throw ApiException.conflict("A category with this slug already exists");
        }
        Category c = Category.create(finalSlug, title, parentId);
        c.setIcon(icon);
        c.setDescription(description);
        c.setPosition(position);
        c.setMetaTitle(metaTitle);
        c.setMetaDescription(metaDescription);
        Category saved = repo.save(c);
        audit.record("CATEGORY_CREATE", "category", saved.getId(), Map.of("slug", finalSlug));
        return saved;
    }

    @CacheEvict(cacheNames = {"category.tree", "homepage.layout"}, allEntries = true)
    @Transactional
    public Category update(UUID id, String title, String slug, UUID parentId, String icon, String description,
                           Short position, Boolean active, String metaTitle, String metaDescription) {
        Category c = repo.findById(id).orElseThrow(() -> ApiException.notFound("Category not found"));
        if (title != null) c.setTitle(title);
        if (slug != null) {
            String newSlug = Slugifier.slugify(slug);
            if (!newSlug.equals(c.getSlug())) {
                if (repo.existsBySlug(newSlug)) throw ApiException.conflict("Slug already in use");
                c.setSlug(newSlug);
            }
        }
        if (parentId != null) c.setParentId(parentId.equals(c.getId()) ? null : parentId);
        if (icon != null) c.setIcon(icon);
        if (description != null) c.setDescription(description);
        if (position != null) c.setPosition(position);
        if (active != null) c.setActive(active);
        if (metaTitle != null) c.setMetaTitle(metaTitle);
        if (metaDescription != null) c.setMetaDescription(metaDescription);
        audit.record("CATEGORY_UPDATE", "category", c.getId(), Map.of("slug", c.getSlug()));
        return c;
    }

    @CacheEvict(cacheNames = {"category.tree", "homepage.layout"}, allEntries = true)
    @Transactional
    public void delete(UUID id) {
        Category c = repo.findById(id).orElseThrow(() -> ApiException.notFound("Category not found"));
        c.setActive(false);
        audit.record("CATEGORY_DEACTIVATE", "category", c.getId(), Map.of());
    }

    public record TreeNode(UUID id, String slug, String title, String icon, String description,
                           List<TreeNode> children) {}
}

package com.couponvalley.categories.api.dto;

import com.couponvalley.categories.application.CategoryService;
import com.couponvalley.categories.domain.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public final class CategoryDtos {

    private CategoryDtos() {}

    public record Summary(UUID id, String slug, String title, String icon,
                          UUID parentId, boolean active, short position) {
        public static Summary from(Category c) {
            return new Summary(c.getId(), c.getSlug(), c.getTitle(), c.getIcon(),
                    c.getParentId(), c.isActive(), c.getPosition());
        }
    }

    public record TreeNode(UUID id, String slug, String title, String icon,
                           String description, List<TreeNode> children) {
        public static TreeNode from(CategoryService.TreeNode n) {
            return new TreeNode(n.id(), n.slug(), n.title(), n.icon(), n.description(),
                    n.children().stream().map(TreeNode::from).toList());
        }
    }

    public record Detail(UUID id, String slug, String title, String icon, String description,
                         UUID parentId, boolean active, short position,
                         String metaTitle, String metaDescription) {
        public static Detail from(Category c) {
            return new Detail(c.getId(), c.getSlug(), c.getTitle(), c.getIcon(), c.getDescription(),
                    c.getParentId(), c.isActive(), c.getPosition(),
                    c.getMetaTitle(), c.getMetaDescription());
        }
    }

    public record Create(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 120) String slug,
            UUID parentId,
            @Size(max = 60) String icon,
            String description,
            @PositiveOrZero Short position,
            @Size(max = 70) String metaTitle,
            @Size(max = 170) String metaDescription
    ) {}

    public record Update(
            @Size(max = 200) String title,
            @Size(max = 120) String slug,
            UUID parentId,
            @Size(max = 60) String icon,
            String description,
            Short position,
            Boolean active,
            @Size(max = 70) String metaTitle,
            @Size(max = 170) String metaDescription
    ) {}
}

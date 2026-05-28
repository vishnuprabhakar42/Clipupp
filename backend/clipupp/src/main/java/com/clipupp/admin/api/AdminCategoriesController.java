package com.clipupp.admin.api;

import com.clipupp.categories.api.dto.CategoryDtos;
import com.clipupp.categories.application.CategoryService;
import com.clipupp.categories.domain.Category;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/categories", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/categories", description = "Admin category CRUD")
public class AdminCategoriesController {

    private final CategoryService categoryService;

    public AdminCategoriesController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "List every category (active + inactive) for admin management")
    public List<CategoryDtos.Detail> list() {
        return categoryService.listForAdmin().stream().map(CategoryDtos.Detail::from).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Fetch a category for editing")
    public CategoryDtos.Detail get(@PathVariable UUID id) {
        return CategoryDtos.Detail.from(categoryService.findForAdmin(id));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create a category")
    public ResponseEntity<CategoryDtos.Detail> create(@RequestBody @Valid CategoryDtos.Create input) {
        Category saved = categoryService.create(
                input.title(), input.slug(), input.parentId(), input.icon(), input.description(),
                input.position() == null ? 0 : input.position(),
                input.metaTitle(), input.metaDescription());
        return ResponseEntity.status(HttpStatus.CREATED).body(CategoryDtos.Detail.from(saved));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update a category")
    public CategoryDtos.Detail update(@PathVariable UUID id, @RequestBody @Valid CategoryDtos.Update input) {
        Category saved = categoryService.update(id, input.title(), input.slug(), input.parentId(),
                input.icon(), input.description(), input.position(), input.active(),
                input.metaTitle(), input.metaDescription());
        return CategoryDtos.Detail.from(saved);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a category")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

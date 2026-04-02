# Story Editor Modernization Plan

## Objective

Build and roll out a production-grade admin story editor with rich text, images, layout blocks, embeds, safe rendering, and backward compatibility.

## Success Criteria

- Admin can create and edit stories with modern rich formatting.
- Images can be uploaded, aligned, captioned, and embedded in content.
- Story content supports layout sections such as two-column, callouts, and dividers.
- Public story page renders safely with sanitization.
- Existing stories remain readable with no data loss.
- Editors get a clear workflow for draft, preview, publish, and unpublish.

## Delivery Strategy

- Ship in 7 phases.
- Keep each phase independently testable.
- Preserve current create and update flows during migration.

## Phase 0: Product and Technical Discovery (1 day)

### Checklist

- [ ] Confirm editor v1 scope (must-have vs nice-to-have).
- [ ] Lock content model for v1 (HTML string as canonical output).
- [ ] Define formatting policy (allowed tags, embeds, image attributes).
- [ ] Define publishing UX rules (draft, publish, unpublish behavior).
- [ ] Define migration rule for legacy plain text stories.
- [ ] Finalize editor library choice (recommended: Tiptap).

### Exit Criteria

- [ ] Written decision document approved.
- [ ] Feature list and non-goals finalized.

## Phase 1: Editor Foundation in Admin Story Form (2 days)

### Checklist

- [ ] Create reusable rich editor component for stories.
- [ ] Replace plain content textarea in admin story form with rich editor.
- [ ] Keep hidden content field binding so existing server actions continue to work.
- [ ] Add toolbar with core marks and blocks.
- [ ] Add bold, italic, underline, and strike.
- [ ] Add heading levels H1 to H4.
- [ ] Add bullet and ordered lists.
- [ ] Add quote and horizontal divider.
- [ ] Add link insert, edit, and remove actions.
- [ ] Add keyboard shortcuts for common commands.
- [ ] Add placeholder and empty-state text.
- [ ] Add content validation hooks.

### Exit Criteria

- [ ] Create and edit story flows work end-to-end.
- [ ] Content persists and reloads correctly in editor.

## Phase 2: Media and Layout Blocks (2 to 3 days)

### Checklist

- [ ] Integrate image upload using existing Supabase storage flow.
- [ ] Support image via URL and file upload.
- [ ] Add image metadata fields (alt text and caption).
- [ ] Add image alignment controls (left, center, right).
- [ ] Add image width presets (small, medium, full).
- [ ] Add two-column layout block.
- [ ] Add callout blocks (info, warning, success).
- [ ] Add divider and highlight quote blocks.
- [ ] Add embed block for YouTube links.
- [ ] Add drag and reorder block support where available.

### Exit Criteria

- [ ] Editor supports mixed text, media, and layout content.
- [ ] Stored output remains valid and renderable on public pages.

## Phase 3: Authoring UX Improvements (1 to 2 days)

### Checklist

- [ ] Add slash command menu for quick insert.
- [ ] Add floating or bubble toolbar for inline formatting.
- [ ] Add character and word count widgets.
- [ ] Add autosave draft every 10 to 20 seconds.
- [ ] Add unsaved-changes leave guard.
- [ ] Add preview mode before publish.

### Exit Criteria

- [ ] Authoring workflow is smooth for non-technical admins.
- [ ] No accidental data loss on navigation.

## Phase 4: Public Rendering and Security Hardening (1 day)

### Checklist

- [ ] Add server-side sanitization for story content rendering.
- [ ] Whitelist allowed tags and attributes.
- [ ] Ensure links include safe attributes.
- [ ] Validate and sandbox embedded media as needed.
- [ ] Add typography styles for rich rendered content.
- [ ] Keep fallback for legacy text with line breaks.

### Exit Criteria

- [ ] Public rendering blocks unsafe HTML and XSS vectors.
- [ ] New and legacy stories render correctly.

## Phase 5: Data Migration and Backward Compatibility (0.5 to 1 day)

### Checklist

- [ ] Audit existing stories for malformed HTML and plain text patterns.
- [ ] Add migration utility for normalization where needed.
- [ ] Batch test old stories in staging.
- [ ] Confirm no content loss in existing stories.

### Exit Criteria

- [ ] Existing stories remain stable post-upgrade.
- [ ] Migration report is completed.

## Phase 6: QA, Performance, and Accessibility (1 to 2 days)

### Checklist

- [ ] Add unit tests for serialization and editor commands.
- [ ] Add integration tests for create, edit, publish, and unpublish flows.
- [ ] Test image upload error paths and retries.
- [ ] Run accessibility checks for toolbar keyboard navigation.
- [ ] Verify ARIA labels and focus order.
- [ ] Validate color contrast in editor controls.
- [ ] Benchmark initial editor load performance.
- [ ] Benchmark long-content editing responsiveness.
- [ ] Add telemetry for save and publish failures.

### Exit Criteria

- [ ] Test suite passes in CI.
- [ ] Accessibility and performance thresholds are met.

## Phase 7: Release, Monitoring, and Rollback (0.5 day)

### Checklist

- [ ] Feature-flag the new editor for controlled rollout.
- [ ] Deploy to staging and run UAT checklist.
- [ ] Roll out to production in steps.
- [ ] Monitor errors, save success rates, and editor feedback.
- [ ] Keep rollback path to old textarea editor for one release cycle.

### Exit Criteria

- [ ] Production rollout is complete without critical regressions.
- [ ] Post-release review is completed.

## Cross-Phase Checklist

- [ ] Update admin documentation for story authoring.
- [ ] Add usage guide for content team.
- [ ] Add troubleshooting playbook for upload and save failures.
- [ ] Keep UI pattern consistency with admin podcast tooling and modals.

## Suggested Milestone Timeline

1. Milestone A (Week 1): Phases 0 to 2 complete.
2. Milestone B (Week 2): Phases 3 to 5 complete.
3. Milestone C (Week 3): Phases 6 to 7 complete and stabilized.

## Risk Register and Mitigations

1. Risk: Editor dependency complexity.
   Mitigation: Start with minimal extension set and expand incrementally.

2. Risk: Unsafe HTML rendering.
   Mitigation: Enforce sanitization before public render.

3. Risk: Existing story breakage.
   Mitigation: Keep legacy fallback and migration validation before rollout.

4. Risk: Upload failures in editor flow.
   Mitigation: Reuse existing upload utility, add retries, and clear error toasts.

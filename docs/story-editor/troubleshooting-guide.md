# Story Editor — Troubleshooting Guide

> **Version:** 1.0.0  
> **Last Updated:** April 4, 2026  
> **Audience:** Support staff, admin users, operations team

---

## Table of Contents

1. [Common Issues](#1-common-issues)
2. [Error Messages](#2-error-messages)
3. [Browser Compatibility](#3-browser-compatibility)
4. [Performance Issues](#4-performance-issues)
5. [Content Recovery](#5-content-recovery)
6. [Image Upload Problems](#6-image-upload-problems)
7. [Autosave Failures](#7-autosave-failures)
8. [Network Connectivity](#8-network-connectivity)
9. [Quick Fixes](#9-quick-fixes)
10. [When to Escalate](#10-when-to-escalate)

---

## 1. Common Issues

### 1.1 Editor Not Loading

**Symptoms:**
- Blank editor area
- Toolbar not appearing
- Spinning loader that doesn't stop

**Possible Causes:**
- JavaScript error
- Network connectivity issue
- Browser compatibility problem
- Ad blocker interference

**Solutions:**

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete → Clear cached images and files
   - Firefox: Ctrl+Shift+Delete → Cached Web Content
   - Safari: Cmd+Option+E
3. **Disable browser extensions temporarily:**
   - Especially ad blockers and privacy extensions
   - Try in incognito/private mode
4. **Check browser console for errors:**
   - Press F12 → Console tab
   - Look for red error messages
   - Share with technical support if needed

### 1.2 Formatting Not Working

**Symptoms:**
- Toolbar buttons don't respond
- Keyboard shortcuts not working
- Text doesn't change when formatting applied

**Solutions:**

1. **Check if text is selected:**
   - Most formatting requires text selection
   - Select text first, then apply formatting
2. **Try keyboard shortcuts instead of toolbar:**
   - Ctrl+B for bold, Ctrl+I for italic
3. **Refresh the page and try again**
4. **Check if cursor is in a special block:**
   - Some blocks have limited formatting options
   - Move to a regular paragraph and try again

### 1.3 Content Not Saving

**Symptoms:**
- "Save failed" message appears
- Changes disappear after refresh
- Autosave indicator stuck on "Saving..."

**Solutions:**

1. **Check network connection:**
   - Verify internet is working
   - Try loading another website
2. **Check autosave status indicator:**
   - Wait for "Saved" confirmation
   - If stuck, manually click Save button
3. **Copy content to clipboard as backup:**
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)
   - Paste into a text editor temporarily
4. **Try manual save:**
   - Click the Save Draft button
   - Wait for confirmation
5. **Check local storage backup:**
   - Content may be saved in browser
   - See Section 5 for recovery steps

---

## 2. Error Messages

### 2.1 "Save Failed" Error

**Message:** "Save failed. Please try again."

**Causes:**
- Network timeout
- Server error
- Authentication expired
- Database connection issue

**Solutions:**

1. **Click the Retry button** (if available)
2. **Wait 30 seconds and try again**
3. **Check if you're still logged in:**
   - Open a new tab
   - Navigate to /admin
   - If redirected to login, log in again
4. **Copy content and refresh page:**
   - Select all content (Ctrl+A)
   - Copy (Ctrl+C)
   - Refresh page
   - Paste content back
   - Try saving again

### 2.2 "Image Upload Failed" Error

**Message:** "Image upload failed. Please try again."

**Causes:**
- File too large (>5MB)
- Invalid file type
- Network issue
- Storage quota exceeded

**Solutions:**

1. **Check file size:**
   - Must be under 5MB
   - Compress image if needed
2. **Check file type:**
   - Supported: JPEG, PNG, WebP, GIF
   - Convert if using unsupported format
3. **Try a different image:**
   - Test with a small test image
   - If works, original image may be corrupted
4. **Wait and retry:**
   - Network may be slow
   - Try again in a few minutes

### 2.3 "Invalid URL" Error

**Message:** "Invalid URL. Please enter a valid link."

**Causes:**
- URL doesn't start with http://, https://, or /
- Malformed URL
- Special characters in URL

**Solutions:**

1. **Check URL format:**
   - External: `https://example.com`
   - Internal: `/about` or `/stories/my-story`
   - Email: `mailto:email@example.com`
2. **Copy URL from browser address bar:**
   - Ensures correct format
   - Paste into link field
3. **Remove special characters:**
   - Some characters may cause issues
   - Try encoding special characters

### 2.4 "Network Error" Message

**Message:** "Network error. Check your connection."

**Causes:**
- Internet disconnected
- Firewall blocking request
- Server temporarily down
- VPN interference

**Solutions:**

1. **Check internet connection:**
   - Try loading another website
   - Check WiFi/ethernet connection
2. **Disable VPN temporarily:**
   - Some VPNs may block requests
   - Try without VPN
3. **Wait and retry:**
   - Server may be temporarily unavailable
   - Try again in 5-10 minutes
4. **Contact IT support:**
   - If problem persists
   - May be network configuration issue

---

## 3. Browser Compatibility

### 3.1 Supported Browsers

**Fully Supported:**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Minimum Requirements:**
- JavaScript enabled
- Cookies enabled
- Local storage enabled

### 3.2 Browser-Specific Issues

**Chrome:**
- Generally most stable
- Best performance
- Recommended for heavy editing

**Firefox:**
- May have slight performance differences
- Keyboard shortcuts work well
- Good alternative to Chrome

**Safari:**
- Some keyboard shortcuts may differ
- Use Cmd instead of Ctrl
- May need to enable local storage

**Edge:**
- Similar to Chrome (Chromium-based)
- Generally works well
- Good compatibility

**Not Supported:**
- Internet Explorer (any version)
- Browsers older than 2 years
- Mobile browsers (limited support)

### 3.3 Checking Browser Version

**Chrome:**
1. Click three dots (⋮) → Help → About Google Chrome
2. Version number displayed

**Firefox:**
1. Click menu (☰) → Help → About Firefox
2. Version number displayed

**Safari:**
1. Safari menu → About Safari
2. Version number displayed

**If browser is outdated:**
- Update to latest version
- Restart browser after update
- Clear cache after update

---

## 4. Performance Issues

### 4.1 Slow Typing / Lag

**Symptoms:**
- Delay between typing and text appearing
- Cursor jumps or stutters
- Editor feels sluggish

**Causes:**
- Very long content (>10,000 words)
- Too many images in content
- Browser running out of memory
- Other tabs consuming resources

**Solutions:**

1. **Close other browser tabs:**
   - Frees up memory
   - Improves performance
2. **Restart browser:**
   - Clears memory leaks
   - Fresh start
3. **Split long stories:**
   - Consider breaking into multiple parts
   - Improves editing experience
4. **Reduce image count:**
   - Too many images can slow editor
   - Consider using image galleries instead

### 4.2 Slow Image Upload

**Symptoms:**
- Upload takes very long
- Progress bar stuck
- Upload times out

**Causes:**
- Large file size
- Slow internet connection
- Server busy

**Solutions:**

1. **Compress images before upload:**
   - Use online tools (TinyPNG, Squoosh)
   - Reduce file size to <1MB if possible
2. **Check internet speed:**
   - Run speed test
   - Upload requires good connection
3. **Upload one image at a time:**
   - Don't upload multiple simultaneously
   - Wait for each to complete
4. **Try during off-peak hours:**
   - Less server load
   - Faster uploads

### 4.3 Editor Freezing

**Symptoms:**
- Editor becomes unresponsive
- Can't type or click
- Browser tab frozen

**Causes:**
- Browser memory issue
- JavaScript error
- Infinite loop (rare)

**Solutions:**

1. **Wait 30 seconds:**
   - May recover on its own
   - Autosave may be running
2. **Force refresh:**
   - Ctrl+Shift+R (hard refresh)
   - Clears cache and reloads
3. **Close and reopen tab:**
   - Last resort
   - Check local storage for recovery
4. **Restart browser:**
   - If problem persists
   - Clear cache before restarting

---

## 5. Content Recovery

### 5.1 Recovering from Local Storage

If you accidentally close the browser or tab:

**Steps:**

1. **Reopen the story editor:**
   - Navigate to the same story
   - Or create new story if it was new
2. **Look for recovery prompt:**
   - "Unsaved content found. Restore?"
   - Click "Restore" to recover
3. **If no prompt appears:**
   - Content may have been autosaved
   - Check the story content
   - May already be there

**Manual recovery:**

1. **Open browser console:**
   - Press F12
   - Go to Console tab
2. **Check local storage:**
   - Application tab → Local Storage
   - Look for story-related keys
3. **Contact technical support:**
   - They can help extract content
   - Provide story ID if available

### 5.2 Recovering from Autosave

**If page crashes or closes:**

1. **Reopen the story:**
   - Navigate back to the story
2. **Check last saved version:**
   - Content should be there
   - Autosave runs every 15 seconds
3. **Check "Last saved" timestamp:**
   - Shows when last autosave occurred
   - May have lost recent changes only

**Maximum data loss:**
- Up to 15 seconds of typing
- Since last autosave
- Local storage may have more recent version

### 5.3 Recovering Deleted Content

**If you accidentally delete content:**

1. **Undo immediately:**
   - Press Ctrl+Z (Cmd+Z on Mac)
   - Can undo multiple times
2. **Check autosave:**
   - Refresh page
   - May restore to last autosaved version
3. **Check local storage:**
   - May have backup
   - See Section 5.1

**If content is permanently lost:**
- Contact technical support
- Database backups may help
- Provide story ID and approximate time

---

## 6. Image Upload Problems

### 6.1 "File Too Large" Error

**Error:** "Image file size exceeds 5MB limit."

**Solutions:**

1. **Compress the image:**
   - Use online tools: TinyPNG, Squoosh, Compressor.io
   - Reduce quality to 80-85%
   - Should significantly reduce file size
2. **Resize the image:**
   - Reduce dimensions to 1920x1080 or smaller
   - Use image editor or online tool
3. **Convert format:**
   - Convert PNG to JPEG (usually smaller)
   - Use WebP format (best compression)

### 6.2 "Invalid File Type" Error

**Error:** "File type not supported."

**Supported formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

**Solutions:**

1. **Check file extension:**
   - Right-click file → Properties
   - Verify it's a supported format
2. **Convert to supported format:**
   - Use image editor
   - Save as JPEG or PNG
3. **Re-download image:**
   - If from internet, may be corrupted
   - Try downloading again

### 6.3 Image Not Displaying

**Symptoms:**
- Broken image icon
- Image uploaded but not showing
- Placeholder instead of image

**Solutions:**

1. **Check image URL:**
   - Click on image in editor
   - Verify URL is correct
2. **Wait for upload to complete:**
   - Progress bar should reach 100%
   - Don't navigate away during upload
3. **Try re-uploading:**
   - Delete broken image
   - Upload again
4. **Check browser console:**
   - Press F12 → Console
   - Look for image loading errors

---

## 7. Autosave Failures

### 7.1 Autosave Not Working

**Symptoms:**
- Status always shows "Not saved"
- No "Saving..." indicator
- Changes lost after refresh

**Solutions:**

1. **Check network connection:**
   - Autosave requires internet
   - Verify connection is stable
2. **Check if logged in:**
   - Session may have expired
   - Log out and log back in
3. **Manually save:**
   - Click Save Draft button
   - Verify save succeeds
4. **Check browser console:**
   - Press F12 → Console
   - Look for autosave errors

### 7.2 "Autosave Failed" Message

**Message:** "Autosave failed. Your changes are backed up locally."

**Causes:**
- Network interruption
- Server error
- Session expired

**Solutions:**

1. **Don't panic:**
   - Content is backed up in browser
   - Won't be lost
2. **Check network:**
   - Verify internet connection
   - Wait for connection to restore
3. **Try manual save:**
   - Click Save Draft button
   - May succeed where autosave failed
4. **Wait for auto-retry:**
   - Autosave will retry automatically
   - Watch for "Saved" confirmation

### 7.3 Autosave Stuck on "Saving..."

**Symptoms:**
- Status shows "Saving..." indefinitely
- Never changes to "Saved"
- Can't tell if saved or not

**Solutions:**

1. **Wait 30 seconds:**
   - May be slow network
   - Give it time to complete
2. **Check network:**
   - May have lost connection
   - Reconnect and wait
3. **Refresh page:**
   - Last resort
   - Check if changes were saved
4. **Copy content first:**
   - Before refreshing
   - Paste back if needed

---

## 8. Network Connectivity

### 8.1 Detecting Network Issues

**Signs of network problems:**
- "Network error" messages
- Autosave failures
- Image uploads failing
- Slow or unresponsive editor

**Quick checks:**

1. **Test internet connection:**
   - Open new tab
   - Try loading google.com
2. **Check WiFi/ethernet:**
   - Verify connected
   - Check signal strength
3. **Test other websites:**
   - If all slow, network issue
   - If only editor, may be server issue

### 8.2 Working Offline

**What works offline:**
- Typing and editing
- Formatting text
- Local storage backup

**What doesn't work offline:**
- Autosave
- Image uploads
- Manual save
- Preview (may not load images)

**Best practices:**

1. **Save before going offline:**
   - Ensure latest version saved
2. **Copy content periodically:**
   - Paste into text editor as backup
3. **Reconnect to save:**
   - Changes will be in local storage
   - Save when connection restored

### 8.3 Recovering After Network Restore

**When connection is restored:**

1. **Check autosave status:**
   - Should resume automatically
   - Watch for "Saved" confirmation
2. **Manually save if needed:**
   - Click Save Draft button
   - Verify success
3. **Check for conflicts:**
   - If edited on multiple devices
   - Latest save wins

---

## 9. Quick Fixes

### 9.1 The "Turn It Off and On Again" Checklist

When in doubt, try these in order:

1. **Refresh the page** (Ctrl+R)
2. **Hard refresh** (Ctrl+Shift+R)
3. **Close and reopen tab**
4. **Restart browser**
5. **Clear browser cache**
6. **Restart computer** (if all else fails)

### 9.2 Emergency Content Backup

**Before trying risky fixes:**

1. **Select all content** (Ctrl+A)
2. **Copy to clipboard** (Ctrl+C)
3. **Paste into text editor** (Notepad, TextEdit, etc.)
4. **Save as backup file**
5. **Now safe to try fixes**

### 9.3 Common Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Toolbar not responding | Refresh page |
| Formatting not applying | Select text first |
| Image won't upload | Check file size (<5MB) |
| Can't save | Check internet connection |
| Editor frozen | Wait 30 seconds, then refresh |
| Keyboard shortcuts not working | Check if in special block |
| Link button disabled | Select text first |
| Autosave stuck | Manually click Save |

---

## 10. When to Escalate

### 10.1 Issues to Report to Technical Support

**Report immediately:**
- Data loss (content disappeared)
- Security concerns
- Repeated crashes
- Critical bugs preventing work

**Report when convenient:**
- Minor UI glitches
- Feature requests
- Performance suggestions
- Documentation errors

### 10.2 Information to Provide

When reporting issues, include:

1. **What happened:**
   - Describe the problem clearly
   - What were you trying to do?
2. **Steps to reproduce:**
   - How can support recreate the issue?
   - List exact steps
3. **Error messages:**
   - Copy exact error text
   - Screenshot if possible
4. **Browser information:**
   - Browser name and version
   - Operating system
5. **Story ID:**
   - If issue with specific story
   - Helps support investigate
6. **Console errors:**
   - Press F12 → Console
   - Screenshot any red errors

### 10.3 Contact Information

**For urgent issues:**
- Contact DEESSA Foundation IT team
- Email: [IT support email]
- Phone: [Support phone number]

**For non-urgent issues:**
- Submit support ticket
- Email: [Support email]
- Include all information from Section 10.2

---

## Related Documentation

- **Previous**: [Admin User Guide](admin-user-guide.md)
- **Next**: [Developer Documentation](developer-documentation.md)
- **Back to**: [Documentation Index](README.md)

---

**Last Updated**: April 4, 2026  
**Version**: 1.0.0

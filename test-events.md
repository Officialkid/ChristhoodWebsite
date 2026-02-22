# Testing the WhatsApp Send Feature

## Steps to Debug:

1. Open `events.html` in your browser
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the Console tab
4. Click "Register" on any event
5. Fill out the wizard steps 1-3
6. On Step 4 (Review), click "Send via WhatsApp"
7. Watch the console for these messages:
   - "Form submitted, current step: 3"
   - "Proceeding with WhatsApp redirect"
   - "submitForm called, currentRole: [role]"
   - "Contact number: [phone]"
   - "Message: [preview]"
   - "Opening URL: [wa.me link]"

## Common Issues & Fixes:

### Issue 1: Button Does Nothing
- **Symptom**: Click "Send via WhatsApp" and nothing happens
- **Check**: Console shows "Not on final step" or "Submit button already disabled"
- **Fix**: Ensure you're on step 4 (Review) - check the progress bar shows 100%

### Issue 2: Popup Blocked
- **Symptom**: Console shows URL but no WhatsApp opens
- **Check**: Browser blocks popup/new tab
- **Fix**: Allow popups for this site in browser settings

### Issue 3: Contact Number Missing
- **Symptom**: Console shows "Contact number: undefined"
- **Check**: currentRole value
- **Fix**: Ensure role selection step completed correctly

### Issue 4: Message Format Issues
- **Symptom**: WhatsApp opens but message looks wrong
- **Check**: Console "Message:" output
- **Fix**: Review form inputs match expected format

## Quick Manual Test:

After filling the form, open browser console and run:
```javascript
console.log('Current step:', currentStep);
console.log('Current role:', currentRole);
console.log('Contact number:', CONTACT_NUMBERS[currentRole]);
console.log('Submit button:', document.getElementById('submitBtn'));
```

If you see errors or undefined values, that's your problem area.

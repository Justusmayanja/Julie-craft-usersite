# Admin Dashboard Consistency Analysis

## Issues Found

### 🔴 **Critical Issues**

1. **Broken API Endpoint**
   - **File:** `components/admin/inventory/stock-adjustment-modal.tsx` (line 146)
   - **Problem:** Calls `/api/inventory/adjust` which doesn't exist
   - **Should:** Call `/api/inventory/adjustments` or use atomic function directly

2. **Direct Stock Updates on Approval**
   - **File:** `app/api/inventory/adjustments/route.ts` (lines 320-334)
   - **Problem:** Uses direct stock update instead of atomic function
   - **Impact:** No transaction, no stock movement records, no audit trail

3. **No Stock Validation on Adjustment Creation**
   - **File:** `app/api/inventory/adjustments/route.ts` (POST handler)
   - **Problem:** Creates adjustment without validating current stock
   - **Impact:** Adjustments can be created with incorrect `previous_physical_stock`

4. **Inconsistent Adjustment Types**
   - **Problem:** Modal uses `increase`/`decrease`/`set`, but API expects different format
   - **Impact:** Data inconsistency and potential errors

### 🟡 **Important Issues**

5. **No Max Stock Validation**
   - Dashboard doesn't check max_stock_level before adjustments
   - Could exceed capacity limits

6. **Missing Stock Movement Records**
   - Approval doesn't create stock movement records
   - Breaks audit trail

7. **No Error Handling for Stock Updates**
   - If stock update fails, adjustment is still marked approved
   - Silent failures lead to data inconsistency

## Current Flow Issues

### Adjustment Creation Flow (Broken)
```
1. User fills form in modal
2. Modal calls /api/inventory/adjust (DOESN'T EXIST) ❌
3. Should call /api/inventory/adjustments
4. Creates adjustment record (pending)
5. No stock validation
```

### Adjustment Approval Flow (Inconsistent)
```
1. Admin approves adjustment
2. Updates adjustment status to 'approved'
3. Directly updates stock_quantity ❌ (should use atomic function)
4. No stock movement record created ❌
5. No audit log entry ❌
```

## Recommended Fixes

### 1. Fix Stock Adjustment Modal
- Update API endpoint from `/api/inventory/adjust` to `/api/inventory/adjustments`
- Ensure data format matches API expectations

### 2. Update Adjustment Approval to Use Atomic Function
- When approving increase adjustments, use `add_inventory_atomic`
- When approving decrease adjustments, create a separate atomic function or handle differently
- Ensure all operations are transactional

### 3. Add Stock Validation on Creation
- Validate current stock when creating adjustment
- Ensure `previous_physical_stock` matches actual stock
- Calculate `new_physical_stock` correctly

### 4. Create Atomic Decrease Function
- Similar to `add_inventory_atomic`, create `decrease_inventory_atomic`
- Or extend existing function to handle both increase and decrease

## Files That Need Updates

1. ✅ `components/admin/inventory/stock-adjustment-modal.tsx` - Fix API endpoint
2. ✅ `app/api/inventory/adjustments/route.ts` - Use atomic functions
3. ✅ `hooks/admin/use-enhanced-inventory.ts` - Fix API endpoint
4. ✅ Create atomic decrease function (or extend add function)

## Consistency Checklist

- [ ] All inventory additions use `add_inventory_atomic`
- [ ] All inventory decreases use atomic function
- [ ] All adjustments create stock movement records
- [ ] All operations have proper audit trails
- [ ] All operations validate stock levels
- [ ] All operations check max stock limits
- [ ] All operations are transactional


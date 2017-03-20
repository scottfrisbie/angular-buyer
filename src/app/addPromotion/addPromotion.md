## Add Promotion Component Overview

This component allows buyer users with an open order to apply a Promotion on their order. This component also handles
the automatically assigned "1% Rebate on Online Orders" Promotion to the cart. The "1% Rebate on Online Orders" assumes:
  1. A ValueExpression of "order.Total * .01" on the Promotion
  2. A Promotion with the ID of "OnePercentRebate" - This is set in the app constants in gulp.config.js (rebateCode)
  3. The Promotion has been assigned to ALL Buyers

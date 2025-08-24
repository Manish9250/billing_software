# Make basic billing app  

## Main Funtions
1. **Billing:** Two types of customer: *Retail* and *Wholesale*
2. **Inventory Management**

## Currents Issues
1. **Variable Pricing:** Diffenent prices for different customers.
2. **Stock Management:** Ensure stock backup. 
***Space vs Money***


## Future Features
1. **Reward System:** Redeem at the end of month when market is at low.


## Dashboard
1. **Tab Based Single Screen App**: Like a browser, where you can access old bills instantly.
2. **In-build Separate Calculator**: Only accessed by num-pad key.


## Relations
1. **Customer:** *ID, Name, Mobile number, Flag(*Wholesale* or *Retail*), 
Unpaid_money.*

2. **Item:** *ID, Name, Weight, Buy_price, Wholesale_price, 
Retail_price, Qty, Alert_qty, Last_buy_date,  Expiry_period.*

3. **Bill:** *ID, Customer_id, Bill_date, Total_amt.*

4. **BillxItem:**  *ID,bill_id, Item_name , Qty , Price_at_that_time.*

5. **customer_item_price:** *Customer_id, Item_id, Custom_price.*

> Day-1: 23/06/25 10:00PM **Created database and config files**

## Api End-Points
1. **Creating customer:** *create, modify number or name, update unpaid money value, get all the customers, searching customers with name or number or id.*

2. **Items:** *create, update, read, delete , searching.* 


3. **Bill:** *create, update, read, delete , searching.*
4. **BillxItem:** *create, update, delete, read.*

> Day-2: 24/06/25 2:30PM **Implemented most of the APIs**

### Problem 1:
`Increment the counter and update the total price in bill using query and backref
`

> **Possible Solution:**
Let frontend do that calculation and at print time update bill values like count and total amount.


5. **custum_customer_price:** *create, read, delete , update.*

> Day-3: 26/06/25 09:36PM  **Backend Completed**

### Problem 2:
`Implement purchase bill
`
> **Possible Solution:**
Let make frontend page in a way that it store all this info of purchased items collectively and do a bulk update at end. 


### Pending implementaion -05/0/25
`In Inventory management, i skipped the "made request when row is dirty" part for now.
`

### Important Feature 1: use calc in cell

`Use "=" to calculate things in cells. Like, =2*12
`

### Important Feature 2: Give amount get quantity
`Enter amount and get quantity or rate, by interchanging values.
Like: Qty(++) * Rate(--) = Amount(constant)
`

### Important Feature 3: Add details on unpaid money
`Add a new table for keeping record of unpiad money having the timestamp, and total unpaid money and how much is paid or added to unpaid money.
`

### Important thing 1: Add History and category in items to track buy time of items

`Add category to items to do analysis based on category and also add a table for items purchase with inward  qty, date and sell price at that time
`

### Categories
1. Tobacco
2. Cosmetics
3. Pulses
4. Soaps and toothpaste
5. Food: Aata, rice, oil and massale
6. Dry Fruits
7. Confectionary


### Add purchase bill : Not implemented
`Reuse the code for New bill just name it laxmi store and then it will post it to items and purchase.
`
`Not eificient: As i have to add new table with columns and the new bill make 
a post request when created.
`
`Possible solution: When entered +50 or something it will made post request to purchase.
`


#### Revert back when clicked delete --> Done
#### custum price --> Done
#### subtract qty when buyed in bill --> On print out make a request to backend to update
#### separate buttons for wholesale bill and retail bill
#### Final printout button
#### Bill History: two ways> one type in search bar other side button list


#### Bug: if a user direclty saves the bill and adds items with entering then it will not be posting and the bill will be blank1
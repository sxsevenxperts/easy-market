# 50 Real Variables That Alter Store Flow & Customer Behavior

## Traffic & Footfall (Variables 1-6)
1. **Current_Time_Hour** - Hour of day (0-23) - impacts customer presence patterns
2. **Day_Of_Week** - Day (1=Monday, 7=Sunday) - weekend vs weekday traffic peaks
3. **Is_Holiday** - Binary flag for national/local holidays - major traffic disruption
4. **Days_To_Payday** - Days until next payday cycle - impacts spending patterns
5. **Weather_Temperature** - Current temp (°C) - affects store visits and product demand
6. **Weather_Precipitation** - Rainfall (mm) - reduces foot traffic

## Weather & Climate (Variables 7-12)
7. **Weather_Humidity** - Air humidity (%) - comfort levels affecting visits
8. **Weather_UV_Index** - UV intensity - drives demand for protective products
9. **Weather_Forecast_24h** - Rain probability next 24h (%) - affects next-day planning
10. **Weather_Extreme_Alert** - Binary extreme weather flag - major disruption events
11. **Temperature_vs_Seasonal_Avg** - Deviation from seasonal average (°C)
12. **Sunrise_Sunset_Time** - Minutes from sunrise/sunset - affects evening traffic

## Seasonality & Events (Variables 13-19)
13. **Month_Number** - Month (1-12) for seasonal patterns
14. **Days_To_Major_Holiday** - Days until Christmas, Easter, etc. (-90 to +365)
15. **School_Holiday_Status** - 0=School, 1=Holidays, 2=Vacation - affects family visits
16. **Local_Events_Today** - Count of local festivals/events nearby (0-5)
17. **Professional_Event_Status** - B2B events/conferences affecting area foot traffic
18. **Carnival_Or_Festival_Days** - Days to/from major Brazilian festivals
19. **Black_Friday_Status** - Days to/from major shopping event (promos active)

## Economic Indicators (Variables 20-26)
20. **Consumer_Confidence_Index** - National sentiment (0-200) - impacts spending
21. **Unemployment_Rate** - Regional unemployment (%) - affects purchasing power
22. **Inflation_Rate** - Monthly inflation (%) - price sensitivity
23. **Interest_Rate** - Central bank rate (%) - credit availability
24. **Currency_Exchange** - BRL/USD rate - affects import prices
25. **Stock_Market_Performance** - IBOVESPA % change last 5 days
26. **Fuel_Price_Index** - Gasoline price change (%) - transport cost impact

## Competitor & Market Data (Variables 27-31)
27. **Nearest_Competitor_Promotion** - Boolean: competitor running major promo
28. **Competitor_Price_Index** - Average price difference vs competitors (%)
29. **Market_Share_Trend** - Our market share trend vs last period (%)
30. **Regional_Sales_Trend** - Total retail sales in region last week (%)
31. **Competitor_Social_Buzz** - Social media mentions of competitors (count)

## Product & Inventory (Variables 32-38)
32. **Out_Of_Stock_Items** - Count of stockouts on high-demand items (0-50)
33. **New_Product_Launches** - Count of new SKUs this week
34. **Product_Recall_Active** - Binary: active product recall affecting sales
35. **Expired_Stock_Percentage** - % of inventory expiring within 7 days
36. **High_Margin_Items_Stock** - Binary: adequate stock of high-margin products
37. **Seasonal_Product_Availability** - % of seasonal items in stock
38. **Supplier_Delivery_Delay** - Days delayed vs expected delivery date

## Social & Digital Trends (Variables 39-44)
39. **Social_Media_Mentions** - Daily mentions (positive + negative) across platforms
40. **Sentiment_Score** - Social sentiment about store (-100 to +100)
41. **Google_Search_Trend** - Search volume for store/category vs baseline (%)
42. **TikTok_Viral_Product** - Binary: trending product that boosts traffic
43. **Influencer_Mention** - Count of influencer posts mentioning store (0-10)
44. **Review_Score_Change** - Net new review sentiment last 7 days

## Operational & Staffing (Variables 45-48)
45. **Staff_Availability** - % of scheduled staff present today
46. **Register_Wait_Time** - Average checkout queue length (minutes)
47. **Shelf_Restocking_Status** - % shelves fully stocked and organized
48. **Store_Temperature_Control** - HVAC efficiency (target temp variance ±°C)

## External Data (Variables 49-50)
49. **News_Sentiment_Category** - News about retail/economy sentiment (-100 to +100)
50. **Traffic_Congestion_Index** - Road congestion affecting store access (0-100)

---

## Data Sources

### Weather APIs
- **OpenWeatherMap API** (free tier) - Variables 5-12
- **INMET** (Brazil weather) - Variables 5-12

### Economic Data
- **IBGE** (Brazilian stats) - Variables 20-26
- **B3** (Stock market) - Variable 25
- **Reuters/Yahoo Finance** - Variables 20, 22-25

### Calendar/Events
- **Google Calendar API** or local database - Variables 13-19
- **EventBrite API** - Variable 16

### Competitor Data (Web Scraping)
- **Competitor websites** - Variables 27-31
- **Google Maps/Reviews** - Variables 28, 44
- **Social listening tools** - Variables 39-43

### Internal Store Data (Database)
- **POS System** - Variables 1-4, 32, 45-47
- **Inventory System** - Variables 32, 35-38

### Social Media
- **Twitter/X API** - Variables 39-43
- **Google Trends** - Variable 41

### Traffic/Access
- **Google Maps Traffic API** - Variable 50

---

## Integration Strategy

Each variable will be:
1. **Collected** from its respective API/source
2. **Normalized** to 0-100 scale for comparison
3. **Time-indexed** with exact timestamp (minutes resolution)
4. **Stored** in `store_flow_variables` table
5. **Used** to weight the predictive AI model via variable importance matrix

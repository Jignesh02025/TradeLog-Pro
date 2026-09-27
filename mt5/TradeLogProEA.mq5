//+------------------------------------------------------------------+
//|                                             TradeLogProEA.mq5    |
//|                                  Copyright 2026, TradeLog Pro   |
//|                                             https://localhost    |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, TradeLog Pro"
#property link      "https://localhost"
#property version   "1.00"
#property description "Expert Advisor to automatically sync trading history to TradeLog Pro web journal"

//--- input parameters
input string   InpApiUrl               = "http://localhost:5000/api/trades/bulk"; // API endpoint URL
input string   InpUserId               = "";                                      // TradeLog Pro User ID (From Profile Page)
input int      InpSyncDays             = 30;                                      // Number of history days to sync
input int      InpSyncIntervalMinutes  = 5;                                       // Sync interval in minutes

//+------------------------------------------------------------------+
//| Helper to format datetime to ISO 8601 UTC string                 |
//|------------------------------------------------------------------|
string GetISODateTime(datetime time)
{
   MqlDateTime dt;
   TimeToStruct(time, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02d.000Z", dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}

//+------------------------------------------------------------------+
//| Parse SL/TP levels from order comments                           |
//| e.g. "[tp 1.15972]", "[sl 1.17058]"                              |
//+------------------------------------------------------------------+
void ParseSlTpFromComment(string comment, double &sl, double &tp)
{
   sl = 0.0;
   tp = 0.0;
   if(comment == "") return;
   
   string lower_comment = comment;
   StringToLower(lower_comment);
   
   int sl_pos = StringFind(lower_comment, "[sl");
   if(sl_pos >= 0)
   {
      int space_pos = StringFind(lower_comment, " ", sl_pos);
      int close_pos = StringFind(lower_comment, "]", sl_pos);
      if(space_pos >= 0 && close_pos > space_pos)
      {
         string sl_str = StringSubstr(comment, space_pos + 1, close_pos - space_pos - 1);
         sl = StringToDouble(sl_str);
      }
   }
   
   int tp_pos = StringFind(lower_comment, "[tp");
   if(tp_pos >= 0)
   {
      int space_pos = StringFind(lower_comment, " ", tp_pos);
      int close_pos = StringFind(lower_comment, "]", tp_pos);
      if(space_pos >= 0 && close_pos > space_pos)
      {
         string tp_str = StringSubstr(comment, space_pos + 1, close_pos - space_pos - 1);
         tp = StringToDouble(tp_str);
      }
   }
}

//+------------------------------------------------------------------+
//| Calculate price movements in pips                                |
//+------------------------------------------------------------------+
double GetPips(string symbol, double entry_price, double exit_price, int deal_type)
{
   double pips = 0;
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   
   if(point == 0) return 0;
   
   double multiplier = 10000.0;
   // Handle JPY pairs and lower digit pairs (Gold, Oil, Crypto, etc.)
   if(StringFind(symbol, "JPY") >= 0 || digits < 4)
   {
      multiplier = 100.0;
   }
   
   double diff = exit_price - entry_price;
   if(deal_type == DEAL_TYPE_SELL) // Exit is Sell -> Entry was Buy
   {
      pips = diff * multiplier;
   }
   else if(deal_type == DEAL_TYPE_BUY) // Exit is Buy -> Entry was Sell
   {
      pips = -diff * multiplier;
   }
   return NormalizeDouble(pips, 1);
}

//+------------------------------------------------------------------+
//| Calculate Risk/Reward ratio based on SL/TP                       |
//+------------------------------------------------------------------+
double GetRiskReward(double entry_price, double stop_loss, double take_profit, int deal_type)
{
   double risk_reward = 0.0;
   if(stop_loss > 0 && take_profit > 0 && entry_price > 0)
   {
      double risk = 0.0;
      double reward = 0.0;
      if(deal_type == DEAL_TYPE_SELL) // Entry was Buy
      {
         risk = entry_price - stop_loss;
         reward = take_profit - entry_price;
      }
      else if(deal_type == DEAL_TYPE_BUY) // Entry was Sell
      {
         risk = stop_loss - entry_price;
         reward = entry_price - take_profit;
      }
      if(risk > 0 && reward > 0)
      {
         risk_reward = NormalizeDouble(reward / risk, 2);
      }
   }
   return risk_reward;
}

//+------------------------------------------------------------------+
//| Format Trade JSON entry string                                   |
//+------------------------------------------------------------------+
string FormatTradeJSON(ulong ticket, datetime time, string symbol, string type_str, double lot_size, double profit_loss, double entry_price, double exit_price, double stop_loss, double take_profit, double pips, double pip_value, double risk_reward, ulong position_id)
{
   string json = "{";
   json += "\"external_id\":\"" + (string)ticket + "\",";
   json += "\"date\":\"" + GetISODateTime(time) + "\",";
   json += "\"pair\":\"" + symbol + "\",";
   json += "\"type\":\"" + type_str + "\",";
   json += "\"lot_size\":" + DoubleToString(lot_size, 2) + ",";
   json += "\"profit_loss\":" + DoubleToString(profit_loss, 2) + ",";
   json += "\"entry_price\":" + DoubleToString(entry_price, 5) + ",";
   json += "\"exit_price\":" + DoubleToString(exit_price, 5) + ",";
   json += "\"stop_loss\":" + DoubleToString(stop_loss, 5) + ",";
   json += "\"take_profit\":" + DoubleToString(take_profit, 5) + ",";
   json += "\"pips\":" + DoubleToString(pips, 1) + ",";
   json += "\"pip_value\":" + DoubleToString(pip_value, 2) + ",";
   json += "\"risk_reward\":" + DoubleToString(risk_reward, 2) + ",";
   json += "\"notes\":\"MT5 Ticket: " + (string)ticket + " | Position: " + (string)position_id + "\"";
   json += "}";
   return json;
}

//+------------------------------------------------------------------+
//| Send HTTP POST request with trade data                           |
//+------------------------------------------------------------------+
void SendTradesToBackend(string json_payload)
{
   char data[];
   char result[];
   string result_headers;
   
   int data_size = StringToCharArray(json_payload, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(data_size > 1) data_size--; // Remove null-terminator
   
   string headers = "Content-Type: application/json\r\n";
   
   ResetLastError();
   int res = WebRequest("POST", InpApiUrl, headers, 5000, data, result, result_headers);
   
   if(res == -1)
   {
      int err = GetLastError();
      Print("WebRequest failed. Error code: ", err);
      if(err == 4014)
      {
         Print("ERROR 4014: WebRequest URL is not allowed. Please add '", InpApiUrl, "' to the allowed URLs list in MT5 (Tools -> Options -> Expert Advisors).");
      }
   }
   else if(res >= 200 && res < 300)
   {
      string response_str = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("Successfully synced trades to TradeLog Pro! Response: ", response_str);
   }
   else
   {
      string response_str = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
      Print("Failed to sync. HTTP Code: ", res, ". Response: ", response_str);
   }
}

//+------------------------------------------------------------------+
//| Query and synchronize trade history                              |
//+------------------------------------------------------------------+
void SyncTrades()
{
   if(InpUserId == "")
   {
      Print("WARNING: User ID is empty. EA will not sync trades until InpUserId is set.");
      return;
   }

   datetime to_date = TimeCurrent();
   datetime from_date = to_date - (InpSyncDays * 24 * 60 * 60);

   // Select history range initially
   if(!HistorySelect(from_date, to_date))
   {
      Print("Failed to select history for the period.");
      return;
   }

   int total_deals = HistoryDealsTotal();
   if(total_deals == 0)
   {
      Print("No deals found in history period.");
      return;
   }

   // Collect exit ticket IDs to prevent loop selection interference
   ulong exit_tickets[];
   int exit_count = 0;

   for(int i = 0; i < total_deals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket <= 0) continue;

      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY)
      {
         double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
         double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
         double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
         
         // Filter out non-trade events (e.g. balance deposits/withdrawals)
         if(profit == 0 && commission == 0 && swap == 0)
         {
            continue; 
         }

         ArrayResize(exit_tickets, exit_count + 1);
         exit_tickets[exit_count] = ticket;
         exit_count++;
      }
   }

   if(exit_count == 0)
   {
      Print("No completed exit deals found to sync.");
      return;
   }

   string trades_json_list = "";
   int sync_count = 0;

   // Process collected exit tickets
   for(int i = 0; i < exit_count; i++)
   {
      ulong ticket = exit_tickets[i];
      
      // Select the exit deal to read its properties
      ulong position_id = (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      long deal_type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      datetime deal_time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      double exit_price = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      
      double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
      double total_profit = profit + commission + swap;

      // Find the entry price and SL/TP by querying position history
      double entry_price = exit_price;
      double stop_loss = 0.0;
      double take_profit = 0.0;
      long close_reason = 0;

      if(HistorySelectByPosition(position_id))
      {
         // Find entry price from DEAL_ENTRY_IN
         int pos_deals_total = HistoryDealsTotal();
         for(int j = 0; j < pos_deals_total; j++)
         {
            ulong p_ticket = HistoryDealGetTicket(j);
            if(p_ticket > 0 && HistoryDealGetInteger(p_ticket, DEAL_ENTRY) == DEAL_ENTRY_IN)
            {
               entry_price = HistoryDealGetDouble(p_ticket, DEAL_PRICE);
               break;
            }
         }

         // Search order comments, sl, tp, and execution reasons
         int pos_orders_total = HistoryOrdersTotal();
         for(int j = 0; j < pos_orders_total; j++)
         {
            ulong o_ticket = HistoryOrderGetTicket(j);
            if(o_ticket > 0)
            {
               double parsed_sl = 0;
               double parsed_tp = 0;
               string o_comment = HistoryOrderGetString(o_ticket, ORDER_COMMENT);
               ParseSlTpFromComment(o_comment, parsed_sl, parsed_tp);
               
               if(parsed_sl > 0) stop_loss = parsed_sl;
               if(parsed_tp > 0) take_profit = parsed_tp;

               double o_sl = HistoryOrderGetDouble(o_ticket, ORDER_SL);
               double o_tp = HistoryOrderGetDouble(o_ticket, ORDER_TP);
               
               if(stop_loss == 0 && o_sl > 0) stop_loss = o_sl;
               if(take_profit == 0 && o_tp > 0) take_profit = o_tp;

               long o_reason = HistoryOrderGetInteger(o_ticket, ORDER_REASON);
               if(HistoryOrderGetInteger(o_ticket, ORDER_POSITION_ID) == (long)position_id && 
                  (o_reason == ORDER_REASON_SL || o_reason == ORDER_REASON_TP))
               {
                  close_reason = o_reason;
               }
            }
         }
      }

      // Check if SL or TP hit and apply exit price if hit level not defined
      if(close_reason == ORDER_REASON_SL && stop_loss == 0)
      {
         stop_loss = exit_price;
      }
      else if(close_reason == ORDER_REASON_TP && take_profit == 0)
      {
         take_profit = exit_price;
      }

      // Calculate pips and pip value
      double pips = GetPips(symbol, entry_price, exit_price, (int)deal_type);
      double pip_value = (pips != 0) ? NormalizeDouble(total_profit / pips, 2) : 0;

      // Calculate Risk/Reward ratio
      double risk_reward = GetRiskReward(entry_price, stop_loss, take_profit, (int)deal_type);

      // Type string: Exit deal SELL (1) means entry was BUY. Exit deal BUY (0) means entry was SELL.
      string type_str = "Other";
      if(deal_type == DEAL_TYPE_SELL) type_str = "Buy";
      else if(deal_type == DEAL_TYPE_BUY) type_str = "Sell";

      string trade_json = FormatTradeJSON(ticket, deal_time, symbol, type_str, volume, total_profit, entry_price, exit_price, stop_loss, take_profit, pips, pip_value, risk_reward, position_id);
      
      if(sync_count > 0)
      {
         trades_json_list += ",";
      }
      trades_json_list += trade_json;
      sync_count++;
   }

   // Restore the global history selection to our sync window
   HistorySelect(from_date, to_date);

   if(sync_count > 0)
   {
      string payload = "{\"userId\":\"" + InpUserId + "\",\"trades\":[" + trades_json_list + "]}";
      Print("Preparing to sync ", sync_count, " trades to API...");
      SendTradesToBackend(payload);
   }
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//|------------------------------------------------------------------|
int OnInit()
{
   Print("Initializing TradeLog Pro EA...");
   
   if(MQLInfoInteger(MQL_TESTER))
   {
      Print("NOTE: WebRequest is not supported in the Strategy Tester. The EA will not be able to sync trades when running a backtest.");
   }

   if(InpUserId == "")
   {
      Print("WARNING: User ID input (InpUserId) is empty! Please configure your User ID from your Trading Journal profile page.");
   }

   // Trigger initial sync on startup
   SyncTrades();

   // Set timer for recurring synchronization
   int interval_seconds = InpSyncIntervalMinutes * 60;
   if(interval_seconds < 60) interval_seconds = 60; // Minimum 1 minute interval
   
   if(!EventSetTimer(interval_seconds))
   {
      Print("Failed to set timer! Background sync will not run.");
      return(INIT_FAILED);
   }

   Print("TradeLog Pro EA initialized successfully. Sync timer set for every ", InpSyncIntervalMinutes, " minutes.");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//|------------------------------------------------------------------|
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("TradeLog Pro EA deinitialized. Reason code: ", reason);
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//|------------------------------------------------------------------|
void OnTimer()
{
   Print("Running scheduled TradeLog Pro background sync...");
   SyncTrades();
}

//+------------------------------------------------------------------+
//| Tick function                                                    |
//|------------------------------------------------------------------|
void OnTick()
{
   // Tick events ignored to avoid blocking high-speed execution with synchronous WebRequest
}
//+------------------------------------------------------------------+

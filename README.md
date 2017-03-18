
Before you start the bot you need install the dependencies using 
`npm install`.

Make sure you defined you environment variables APP_ID and APP_SECRET and 
that they contain MSA OAuth credentials.

You can start the bot with `node app.js`. By default the server will
be listening on port 5000.
So service endpoint will be "https://example.com:5000/chat"


```
cd pathto/mybot/steefulcoxbot
git checkout dev
git pull
git remote add heroku https://git.heroku.com/steefulcoxbot.git
# make changes 
# git add . && git commit -m "features"
git push heroku master
# don't forget to push to github :) 
```

# mybot

Notes:

Initial Scan –
Module 1 

- [x] 1.  Is there a date.period or datetime key:value a.  If yes, then it goes in the ‘ Where section within the “SQL Statement”b.  If no, then  we need to ask 

- [x] 2.  Is there a calculated measure in the ‘ Where’  Object a.  If yes, then the calculated measure will have to be in the ‘ HAVING’  section b.  We might want to verify that they do not want to see it...and just have it as a filter 

- [x] 3.  Is there a calculated measure in the ‘ Select’  Object a.  If yes, then it should appear in the select section 

- [x] 4.  If a ‘ Select’  Object has a column and calculated measure then order the ‘ SQL Select’  section with columns first and then calculated measures

[Getting api.ai json data back from this response](https://github.com/dstiefe/mybot/blob/master/steefulcoxbot/skypebot.js#L88)

# Test Locally

[Download Bot-Framework-Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases)
Paste in AppId and AppSecret, 

run server.js locally 

```
npm install
#install dependencies
npm start
#node server.js
```



Search queries


show me a last 3 session

what are the workflows that have a total running time greater than 100 and total error is less than 1

by session where total running time is greater than 100 for the last 3 weeks

by workflow where total running time is greater than 100 and total error is less than 1 and total source rows is less than 5 for the last 9 week

show me the total target rows where workflow equals run-stats

what were the total source rows between may and june of last year where total running time is greater than 100

what were the total number of target rows processed for the last nine weeks by day by workflow

by session where total running time is greater than 100 for the last 9 weeks

by workflow where total running time is greater than 100 and total error is less than 1 for the last 9 week


==========================
show me top 3 workflows that had the least errors the past 3 weeks
show me top 3 workflows that had the least errors yesterday
show me top 3 workflows that had the most errors
show me the top 10 sessions that had the longest running time yesterday
show me the top 3 sessions that had the most source throughput over the past 3 weeks

show me top 10 workflows for the last 3 weeks

==========================

Data Flow

Current Data Flow 
  1. get user's phrase from UI
  2. call api.ai request, get response
  3. parsing response
  4. get dates/date range if missing from UI
  5. execute sql qeury on redshift, get count of rows
  6. ask about limit query (10 rows) from UI
  7. ask about sorting by CalcMeasures from UI
  8. ask about sorting direction by CalcMeasures from UI
  9. display data (execute sql qeury on redshift)

Future Data Flow 
  1. get user's phrase from UI
  2. call api.ai request, get response
  3. parsing response
  4. get dates/date range from UI, if missing 
  5. If selected date-range, we should get week/day/hour/minute/full period for grouping by date
  6. If don't have a Fact column from API.AI, ask Fact column from UI
  7. If don't have a aggregation function for Fact from API.AI, ask aggregation function for Fact from UI
 if it's a "Fact" type column

  8. ask about showing aggregation function in SELECT, if need 

  9. ask about sorting by facts from UI, if don't have a sorting 
 just ask for primary and sort order
  10. ask about sorting direction by facts from UI, if don't have a sorting direction
 just ask for primary and sort order

  11. execute sql qeury on redshift, get count of rows

  12. ask about limit query (10 rows) from UI? If don't have a limit
  
I say if we get the sort order then we just show the 10 ...and then tell them there were a total of "x" number of records

  13. display data 10 rows (execute sql qeury on redshift)

  14  put all data in a csv file
  15 upoad to s3 for now

  16 provide a link so they can download









  2b - done
  3a - done
  4a - done
  5a - done
  5b - done
  1a,1c - done
  1b - done
  5c - done

  2a -  need to do

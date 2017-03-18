select COUNT(*) from
(SELECT WORKFLOW FROM mytropical.public.coxrunstats WHERE (mydate >= '2016-11-01' and mydate <= '2017-03-09') GROUP BY WORKFLOW HAVING sum(RUN_MINS) > 90000)
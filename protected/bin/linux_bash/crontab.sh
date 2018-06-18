
*/1 * * * * root echo "[`date +"\%F \%T"`] `node /data/webapps/spider.duowan.com/protected/bin/checkZombieChrome.js`" >> /tmp/checkZombieChrome.log &

*/1 * * * * root echo "[`date +"\%F \%T"`] `node /data/webapps/spider.duowan.com/protected/bin/checkZombieSpider.js`" >> /tmp/checkZombieSpider.log &

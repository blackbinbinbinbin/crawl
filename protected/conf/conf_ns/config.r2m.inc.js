// 常量
global["REDIS_PRE_KEY_RANDOM_ID"] = 'genRandomId:';

// 数组
 
var r2mConf = {};
r2mConf = {"host":"61.160.36.225","port":"9501","pwd":"test"}; 
r2mConf["default"] = {"host":"61.160.36.225","port":"9501","pwd":"test"}; 
r2mConf["wuxiduoxian01_shop"] = {"host":"61.160.36.225","port":"9501","pwd":"test"}; 
var r2mConf_wuxiduoxian01_shop = {};
r2mConf_wuxiduoxian01_shop = {"host":"61.160.36.225","port":"9501","pwd":"test"}; 
var r2mInfo = {};
r2mInfo["dw_ka"] = {};
r2mInfo["dw_ka"]["act"] = {"key":"act_id","ttl":"3600"}; 
r2mInfo["dw_ka"]["blacklist_ip"] = {"key":"app_name,ip","ttl":"300"}; 
r2mInfo["dw_ka"]["blacklist_ka_user"] = {"key":"app_name,user_id","ttl":"600"}; 
r2mInfo["dw_ka"]["blacklist_yyuser"] = {"key":"app_name,yyuid","ttl":"3600"}; 
r2mInfo["dw_ka"]["blacklist_yy_user"] = {"key":"app_name,yyuid","ttl":"600"}; 
r2mInfo["dw_ka"]["game_info"] = {"key":"game_id","ttl":"600"}; 
r2mInfo["dw_ka"]["game_type"] = {"key":"game_type_id","ttl":"0"}; 
r2mInfo["dw_ka"]["gift_info"] = {"key":"gift_id","ttl":"600"}; 
r2mInfo["dw_ka"]["gift_online"] = {"key":"gift_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["gift_recommend"] = {"key":"gift_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["gift_res"] = {"key":"res_id","ttl":"600"}; 
r2mInfo["dw_ka"]["lottery_reward"] = {"key":"reward_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["qa"] = {"key":"qa_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["qa_items"] = {"all_key":"qa_id,item_id","key":"item_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["user"] = {"key":"user_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["wx_lucky_money"] = {"key":"id","ttl":"86400"}; 
r2mInfo["dw_ka"]["wx_message"] = {"key":"msg_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["zt_call"] = {"key":"id","ttl":"86400"}; 
r2mInfo["dw_ka"]["zt_lottery"] = {"key":"lottery_id","ttl":"86400"}; 
r2mInfo["dw_ka"]["zt_r_lottery_gift"] = {"key":"gift_id","ttl":"86400"}; 
r2mInfo["dw_shop"] = {};
r2mInfo["dw_shop"]["back_order"] = {"key":"back_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["cart"] = {"all_key":"user_id","key":"cart_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["collect_goods"] = {"all_key":"user_id","key":"collect_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["coupons"] = {"key":"coupon_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["delivery_order"] = {"key":"delivery_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["order_action"] = {"key":"action_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["order_finance"] = {"all_key":"finance_order_sn","key":"id","ttl":"86400"}; 
r2mInfo["dw_shop"]["order_info"] = {"all_key":"user_id","key":"order_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["user_coupons"] = {"key":"id","ttl":"86400"}; 
r2mInfo["dw_shop"]["user_exchange_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["dw_shop"]["user_message"] = {"all_key":"user_id","key":"msg_id","ttl":"86400"}; 
r2mInfo["dw_sy"] = {};
r2mInfo["dw_sy"]["game_company"] = {"key":"company_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_forbid_word"] = {"key":"forbid_word","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_info"] = {"key":"game_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_package_android"] = {"key":"game_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_package_ios"] = {"key":"game_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_package_operations"] = {"key":"game_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_rank"] = {"key":"rank_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_recommend"] = {"key":"game_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_resource"] = {"all_key":"game_id,source_id","key":"source_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["game_spider_conf"] = []; 
r2mInfo["dw_sy"]["game_spider_log"] = []; 
r2mInfo["dw_sy"]["game_type"] = {"key":"game_type_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["hot_word"] = {"key":"hot_word","ttl":"3600"}; 
r2mInfo["dw_sy"]["operations_rank"] = {"key":"game_id","ttl":"3600"}; 
r2mInfo["dw_sy"]["search_static"] = {"key":"keyword","ttl":"3600"}; 
r2mInfo["dw_sy_data"] = {};
r2mInfo["dw_sy_data"]["search_static"] = {"key":"keyword","ttl":"3600"}; 
r2mInfo["dw_task"] = {};
r2mInfo["dw_task"]["ad_position"] = {"key":"id","ttl":"0"}; 
r2mInfo["dw_task"]["game_download"] = {"key":"id","ttl":"86400"}; 
r2mInfo["dw_task"]["gold_record"] = {"key":"id","ttl":"300"}; 
r2mInfo["dw_task"]["login_record"] = {"key":"id","ttl":"86400"}; 
r2mInfo["dw_task"]["login_reward_config"] = {"key":"shop_id,login_days","ttl":"86400"}; 
r2mInfo["dw_task"]["share_visitor_record"] = {"key":"record_id","ttl":"86400"}; 
r2mInfo["dw_task"]["short_url"] = {"key":"url_id","ttl":"86400"}; 
r2mInfo["dw_task"]["sign_record"] = {"key":"id","ttl":"172800"}; 
r2mInfo["dw_task"]["task"] = {"all_key":"shop_id,task_id","key":"task_id","ttl":"86400"}; 
r2mInfo["dw_task"]["task_execute_record"] = {"key":"record_id","ttl":"86400"}; 
r2mInfo["dw_task"]["task_record"] = {"key":"id","ttl":"300"}; 
r2mInfo["dw_task"]["user"] = {"key":"shop_id, user_id","ttl":"86400"}; 
r2mInfo["dw_task"]["user_task"] = {"key":"yyuid,task_id,create_date","ttl":"300"}; 
r2mInfo["fhvideo_home"] = {};
r2mInfo["fhvideo_home"]["appChannel"] = {"key":"id"}; 
r2mInfo["fit_db"] = {};
r2mInfo["fit_db"]["app_map"] = {"key":"app_id","ttl":"86400"}; 
r2mInfo["fit_db"]["course"] = {"all_key":"gym_id","key":"course_id","ttl":"86400"}; 
r2mInfo["fit_db"]["course_vote_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["fit_db"]["group_course"] = {"all_key":"gym_id","key":"group_course_id","ttl":"86400"}; 
r2mInfo["fit_db"]["gym"] = {"key":"gym_id","ttl":"86400"}; 
r2mInfo["fit_db"]["gym_ad"] = {"key":"ad_id","ttl":"86400"}; 
r2mInfo["fit_db"]["gym_card"] = {"key":"card_id","ttl":"86400"}; 
r2mInfo["fit_db"]["gym_subbranch"] = {"key":"subbranch_id","ttl":"86400"}; 
r2mInfo["fit_db"]["gym_user"] = {"all_key":"gym_id","key":"user_id","ttl":"86400"}; 
r2mInfo["fit_db"]["gym_user_info"] = {"key":"user_id,gym_id","ttl":"86400"}; 
r2mInfo["fit_db"]["music"] = {"key":"qq_songmid","ttl":"86400"}; 
r2mInfo["fit_db"]["music_share"] = {"key":"music_id","ttl":"86400"}; 
r2mInfo["fit_db"]["order_finance"] = {"all_key":"finance_order_sn","key":"id","ttl":"86400"}; 
r2mInfo["fit_db"]["place"] = {"all_key":"gym_id","key":"place_id","ttl":"86400"}; 
r2mInfo["fit_db"]["post"] = {"key":"id","ttl":"86400"}; 
r2mInfo["fit_db"]["post_comment"] = {"key":"id","ttl":"86400"}; 
r2mInfo["fit_db"]["post_media"] = {"key":"id","ttl":"86400"}; 
r2mInfo["fit_db"]["post_support"] = {"key":"id","ttl":"86400"}; 
r2mInfo["fit_db"]["post_tag"] = {"key":"id","ttl":"86400"}; 
r2mInfo["fit_db"]["region"] = {"all_key":"parent_id","key":"region_id","ttl":"86400"}; 
r2mInfo["fit_db"]["trade_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["fit_db"]["weixinOpenId"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"] = {};
r2mInfo["hiyd_cms"]["app_tools"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["articles"] = {"key":"aid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["articles_keyword"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["articles_tags"] = {"key":"aid,tid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["audio_comment"] = {"key":"course_id,day,index,gender","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_course"] = {"key":"bb_cid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_course_day_info"] = {"key":"bb_cid,day","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_course_exercise"] = {"key":"bb_cid,day,workout_id,group_sequence,sort","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_course_group"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_exercise_desc"] = {"key":"desc_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_exercise_workout"] = {"key":"workout_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_relational_video"] = {"key":"bb_cid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_super_group"] = {"key":"group_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["bb_training_point"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["category"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["com_comments"] = {"key":"app_id,comment_target,comment_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["com_replies"] = {"key":"comment_id,reply_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["com_support"] = {"key":"comment_id,uid,support_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["course"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["day_info"] = {"key":"course_id,day,gender","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["equipment"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["exercise"] = {"key":"id","table":"exercise,v_course_exercises,v_workout_exercises","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["file"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["file_dw_video"] = {"key":"vid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["muscle"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["plan"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["plan_base"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["plan_body"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["plan_info"] = {"key":"plan_id,plan_day","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["plan_target"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["relational_course"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["r_exercise_group"] = {"key":"exercise_id,group_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["r_plan"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["sns_post_user"] = {"key":"uid,sub_uid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["sns_region"] = {"key":"region_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["tags"] = {"key":"tid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["template"] = {"key":"tpl_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["topic_url"] = {"key":"tpl_id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["training_point"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["v_bb_course"] = {"key":"bb_cid","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["v_course"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["v_course_exercises"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["v_workout_exercises"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_cms"]["workout"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"] = {};
r2mInfo["hiyd_home"]["ad"] = {"key":"ad_id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["badge"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["badgeRecord"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["black_domain_ip"] = {"key":"ad_id","ttl":"3600"}; 
r2mInfo["hiyd_home"]["food_group"] = {"key":"group_id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["food_info"] = {"key":"info_id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["food_restaurant"] = {"key":"restaurant_id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["health_report"] = {"key":"report_id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["health_report_app"] = {"key":"report_id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["mission"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["post"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["postComment"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["postMedia"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["share_visitor_record"] = {"key":"share_uid,device_token","ttl":"86400"}; 
r2mInfo["hiyd_home"]["user"] = {"key":"user_id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userAccount"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userCustomExerciseRecord"] = {"key":"uid,bid,courseDay,type","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userFinishedPlanCourse"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userFinishedStep"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userFinishedWorkout"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userFoodRecommend"] = {"key":"uid","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userJoinBBCourse"] = {"key":"uid,bb_cid","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userJoinCourse"] = {"key":"uid,courseId","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userJoinWorkout"] = {"key":"uid,workoutId","ttl":"86400"}; 
r2mInfo["hiyd_home"]["userSharePlan"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_home"]["user_trained_statistics_daily"] = {"key":"uid,trained_date","ttl":"86400"}; 
r2mInfo["hiyd_home"]["user_trained_statistics_monthly"] = {"key":"uid,trained_year,month_index","ttl":"86400"}; 
r2mInfo["hiyd_home"]["user_trained_statistics_weekly"] = {"key":"uid,trained_year,week_index","ttl":"86400"}; 
r2mInfo["hiyd_home"]["v_user"] = {"key":"user_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"] = {};
r2mInfo["hiyd_meal"]["ad"] = {"key":"ad_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["admin_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["attribute"] = {"key":"attr_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["back_order"] = {"key":"back_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["cart"] = {"all_key":"user_id","key":"cart_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["collect_goods"] = {"all_key":"user_id","key":"collect_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["coupons"] = {"key":"coupon_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["delivery_order"] = {"key":"delivery_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["food_recommend"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["gift"] = {"key":"gift_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["goods"] = {"key":"goods_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["goods_gallery"] = {"key":"img_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["meals_daily"] = {"key":"meals_day,goods_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["meals_delivery_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["meals_item"] = {"key":"item_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["money_record"] = {"key":"rec_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["order_action"] = {"key":"action_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["order_finance"] = {"all_key":"finance_order_sn","key":"id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["order_info"] = {"all_key":"user_id","key":"order_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["products"] = {"key":"product_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["recharge_order_finance"] = {"all_key":"finance_order_sn","key":"id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["region"] = {"all_key":"parent_id","key":"region_id","ttl":"0"}; 
r2mInfo["hiyd_meal"]["r_shop_company"] = {"key":"shop_id,company_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["shipping"] = {"key":"shipping_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["shipping_area"] = {"key":"shipping_area_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["shipping_company"] = {"key":"company_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["shop"] = {"key":"shop_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["shop_bulletin"] = {"key":"bulletin_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["shop_minus"] = {"key":"minus_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["star_card"] = {"key":"card_id","ttl":"0"}; 
r2mInfo["hiyd_meal"]["suppliers"] = {"key":"suppliers_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["user"] = {"key":"user_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["user_coupons"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["user_info"] = {"key":"user_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["user_message"] = {"all_key":"user_id","key":"msg_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["web_recommend_group"] = {"key":"group_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["web_recommend_item"] = {"key":"item_id","ttl":"86400"}; 
r2mInfo["hiyd_meal"]["web_shop_ad"] = {"key":"ad_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"] = {};
r2mInfo["hiyd_shop"]["ad"] = {"key":"ad_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["admin_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["attribute"] = {"key":"attr_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["back_order"] = {"key":"back_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["cart"] = {"all_key":"user_id","key":"cart_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["collect_goods"] = {"all_key":"user_id","key":"collect_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["coupons"] = {"key":"coupon_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["delivery_order"] = {"key":"delivery_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["food_recommend"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["gift"] = {"key":"gift_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["goods"] = {"key":"goods_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["goods_gallery"] = {"key":"img_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["meals_delivery_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["meals_item"] = {"key":"item_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["money_record"] = {"key":"rec_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["order_action"] = {"key":"action_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["order_finance"] = {"all_key":"finance_order_sn","key":"id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["order_info"] = {"all_key":"user_id","key":"order_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["products"] = {"key":"product_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["region"] = {"all_key":"parent_id","key":"region_id","ttl":"0"}; 
r2mInfo["hiyd_shop"]["r_shop_company"] = {"key":"shop_id,company_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["shipping"] = {"key":"shipping_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["shipping_area"] = {"key":"shipping_area_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["shipping_company"] = {"key":"company_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["shop"] = {"key":"shop_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["shop_bulletin"] = {"key":"bulletin_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["shop_minus"] = {"key":"minus_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["star_card"] = {"key":"card_id","ttl":"0"}; 
r2mInfo["hiyd_shop"]["suppliers"] = {"key":"suppliers_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["user"] = {"key":"user_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["user_coupons"] = {"key":"id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["user_exchange_log"] = {"key":"log_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["user_info"] = {"key":"user_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["user_message"] = {"all_key":"user_id","key":"msg_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["web_recommend_group"] = {"key":"group_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["web_recommend_item"] = {"key":"item_id","ttl":"86400"}; 
r2mInfo["hiyd_shop"]["web_shop_ad"] = {"key":"ad_id","ttl":"86400"}; 
r2mInfo["o2o_store"] = {};
r2mInfo["o2o_store"]["bodybuilding"] = {"key":"auto_id","ttl":"86400"}; 
r2mInfo["oujhome"] = {};
r2mInfo["oujhome"]["chapterHistory"] = {"all_key":"uid,device_token,bookId","key":"chapter_history_id","ttl":"86400"}; 
r2mInfo["oujhome"]["news"] = {"key":"news_id","ttl":"86400"}; 
r2mInfo["oujhome"]["recommendBook"] = {"key":"rec_id","ttl":"86400"}; 
r2mInfo["shop_base"] = {};
r2mInfo["shop_base"]["ad"] = {"key":"ad_id","ttl":"86400"}; 
r2mInfo["shop_base"]["attribute"] = {"key":"attr_id","ttl":"86400"}; 
r2mInfo["shop_base"]["category"] = {"key":"cat_id","ttl":"86400"}; 
r2mInfo["shop_base"]["gift"] = {"key":"gift_id","ttl":"86400"}; 
r2mInfo["shop_base"]["goods"] = {"key":"goods_id","ttl":"86400"}; 
r2mInfo["shop_base"]["goods_gallery"] = {"key":"img_id","ttl":"86400"}; 
r2mInfo["shop_base"]["products"] = {"key":"product_id","ttl":"86400"}; 
r2mInfo["shop_base"]["region"] = {"all_key":"parent_id","key":"region_id","ttl":"0"}; 
r2mInfo["shop_base"]["r_shop_company"] = {"key":"shop_id,company_id","ttl":"86400"}; 
r2mInfo["shop_base"]["shipping"] = {"key":"shipping_id","ttl":"86400"}; 
r2mInfo["shop_base"]["shipping_area"] = {"key":"shipping_area_id","ttl":"86400"}; 
r2mInfo["shop_base"]["shipping_company"] = {"key":"company_id","ttl":"86400"}; 
r2mInfo["shop_base"]["shop"] = {"key":"shop_id","ttl":"86400"}; 
r2mInfo["shop_base"]["shop_bulletin"] = {"key":"bulletin_id","ttl":"86400"}; 
r2mInfo["shop_base"]["shop_minus"] = {"key":"minus_id","ttl":"86400"}; 
r2mInfo["shop_base"]["suppliers"] = {"key":"suppliers_id","ttl":"86400"}; 
r2mInfo["shop_base"]["tpl_group"] = {"key":"tpl_goods_id","ttl":"3600"}; 
r2mInfo["svideo_home"] = {};
r2mInfo["svideo_home"]["admin"] = {"key":"uid","ttl":"86400"}; 
r2mInfo["svideo_home"]["adminMediaAccount"] = {"key":"id","ttl":"86400"}; 
r2mInfo["svideo_home"]["article"] = {"key":"uid","ttl":"86400"}; 
r2mInfo["svideo_home"]["articleAuditRecord"] = {"key":"id","ttl":"86400"}; 
r2mInfo["svideo_home"]["articleTag"] = {"key":"id","ttl":"86400"}; 
r2mInfo["svideo_home"]["articleTagWait"] = {"key":"id","ttl":"86400"}; 
r2mInfo["svideo_home"]["articleWait"] = {"key":"uid","ttl":"86400"}; 
r2mInfo["svideo_home"]["mediaAccount"] = {"key":"id","ttl":"86400"}; 
r2mInfo["svideo_home"]["notice"] = {"key":"id","ttl":"86400"}; 
r2mInfo["svideo_home"]["tag"] = {"key":"id","ttl":"86400"}; 
r2mInfo["svideo_home"]["tagUserMap"] = {"key":"id","ttl":"86400"};
exports["r2mConf"] = r2mConf;
exports["r2mConf_wuxiduoxian01_shop"] = r2mConf_wuxiduoxian01_shop;
exports["r2mInfo"] = r2mInfo;

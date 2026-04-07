package com.flashsale.flashsale_pro.mq;

import com.flashsale.flashsale_pro.config.RabbitMQConfig;
import com.flashsale.flashsale_pro.service.impl.FlashSaleOrderServiceImpl;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SeckillOrderConsumer {

    @Autowired
    private FlashSaleOrderServiceImpl flashSaleOrderService;

    @RabbitListener(queues = RabbitMQConfig.SECKILL_QUEUE)
    public void consume(SeckillOrderMessage message) {
        flashSaleOrderService.consumeSeckillOrder(message);
    }
}

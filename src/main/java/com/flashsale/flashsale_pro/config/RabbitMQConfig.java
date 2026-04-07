package com.flashsale.flashsale_pro.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String SECKILL_EXCHANGE = "flashsale.seckill.exchange";
    public static final String SECKILL_QUEUE = "flashsale.seckill.queue";
    public static final String SECKILL_ROUTING_KEY = "flashsale.seckill.create";

    @Bean
    public DirectExchange seckillExchange() {
        return new DirectExchange(SECKILL_EXCHANGE, true, false);
    }

    @Bean
    public Queue seckillQueue() {
        return new Queue(SECKILL_QUEUE, true);
    }

    @Bean
    public Binding seckillBinding(Queue seckillQueue, DirectExchange seckillExchange) {
        return BindingBuilder.bind(seckillQueue).to(seckillExchange).with(SECKILL_ROUTING_KEY);
    }
}

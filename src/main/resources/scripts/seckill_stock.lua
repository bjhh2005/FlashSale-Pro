local stockKey = KEYS[1]
local boughtKey = KEYS[2]
local userId = ARGV[1]
local quantity = tonumber(ARGV[2])

if redis.call('SISMEMBER', boughtKey, userId) == 1 then
    return 2
end

local stock = tonumber(redis.call('GET', stockKey))
if not stock or stock < quantity then
    return 1
end

redis.call('DECRBY', stockKey, quantity)
redis.call('SADD', boughtKey, userId)
return 0

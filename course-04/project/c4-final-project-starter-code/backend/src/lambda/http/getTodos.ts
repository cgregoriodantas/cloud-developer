import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { getAllTodos } from '../../helpers/todos'
import { getUserId, parseLimitParameter, parseNextKeyParameter, encodeNextKey } from '../utils';

// TODO: Get all TODO items for a current user
const logger = createLogger('getTodos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  logger.info('Processing event: ', event)

  let nextKey 
  let limit 

  try {
    
    nextKey = parseNextKeyParameter(event)
    limit = parseLimitParameter(event) || 20
  } catch (e) {
    logger.error('Failed to parse query parameters: ', e.message)
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid parameters'
      })
    }
  }

  const userId = getUserId(event)
  const items = await getAllTodos(userId, nextKey, limit);

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: items.todoItems,
     
      nextKey: encodeNextKey(items.lastEvaluatedKey)
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)


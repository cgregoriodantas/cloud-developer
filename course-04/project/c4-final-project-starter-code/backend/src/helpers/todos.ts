import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem, PageableTodoItems } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import { Key } from 'aws-sdk/clients/dynamodb'
import * as uuid from 'uuid'

// TODO: Implement businessLogic
const todoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

const logger = createLogger('todos')

export async function getAllTodos(userId: string, nextKey: Key, limit: number): Promise<PageableTodoItems> {
    const items = await todoAccess.getAllTodos(userId, nextKey, limit)

    for (let item of items.todoItems) {
        if (!!item['attachmentUrl'])
            item['attachmentUrl'] = attachmentUtils.getDownloadUrl(item['attachmentUrl'])
    }

    return items
}

export async function createTodo(
    createTodoequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {
    const todoId = uuid.v4()

    return await todoAccess.createTodo({
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        ...createTodoequest
    } as TodoItem)
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
    // Delete attachment object from S3
    logger.info('delete S3 object', todoId)
    await attachmentUtils.deleteAttachment(todoId)

    // TODO: Remove a TODO item by id
    logger.info('delete TODO item', userId, todoId)
    await todoAccess.deleteTodo(userId, todoId)
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<void> {
    const validTodo = await todoAccess.getTodo(userId, todoId)

    if (!validTodo) {
        throw new Error('404')
    }
    
    logger.info('Updating todo: ', userId, updatedTodo)
    return await todoAccess.updateTodo(userId, todoId, updatedTodo)
}


export async function createAttachmentPresignedUrl(userId:string, todoId: string): Promise<string> {
    const validTodo = await todoAccess.getTodo(userId, todoId)

    if (!validTodo) {
        throw new Error('404')
    }

    const url = attachmentUtils.getUploadUrl(todoId)
    await todoAccess.updateAttachment(userId, todoId)
    return url
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Render,
} from '@nestjs/common';
import { ApiBasicAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Action, ActionType, AppService } from './app.service';
import { Public } from './auth/auth.guard';

@ApiBasicAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @HttpCode(200)
  @Public()
  @Render('index')
  async root() {
    return { message: await this.appService.getReport() };
  }

  @Get('/actions')
  @HttpCode(200)
  @ApiResponse({
    type: [Action],
  })
  async getAll() {
    return await this.appService.getAllActions();
  }

  @Post('/actions')
  @ApiResponse({
    type: [Action],
  })
  async create(@Body() action: Action) {
    if (
      (action.type !== ActionType.NOTE && action.value) ||
      (action.type === ActionType.NOTE && !action.value)
    )
      return {
        error: "'value' should be only available if the type is 'note'",
      };
    await this.appService.addAction(action);
    return await this.appService.getAllActions();
  }

  @Delete('/actions')
  @HttpCode(204)
  async delete() {
    await this.appService.deleteActions();
  }

  @Get('/report')
  @ApiQuery({ name: 'json', type: 'boolean', required: false })
  @ApiResponse({
    schema: {
      oneOf: [
        { type: 'string', description: 'Report in HTML format' },
        {
          type: 'string',
          description: 'Report in JSON format',
        },
      ],
    },
  })
  async generateReport(@Query('json') asJson = false) {
    return asJson
      ? this.appService.getReportData()
      : this.appService.getReport();
  }
}

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { readFile, writeFile } from 'fs/promises';
import { IsInOrNull, IsStringOrNull } from './validator';

export enum ActionType {
  BAN = 'ban',
  WARN = 'warn',
  NOTE = 'note',
}

export enum Messenger {
  WHATSAPP = 'whatsapp',
  MATRIX = 'matrix',
  TELEGRAM = 'telegram',
  DISCORD = 'discord',
}

const actionTypeNames = {
  [ActionType.BAN]: 'Banns',
  [ActionType.WARN]: 'Verwarnungen',
  [ActionType.NOTE]: 'Ereignisse',
};

const messengerTypeNames = {
  [Messenger.WHATSAPP]: 'WhatsApp',
  [Messenger.MATRIX]: 'Matrix',
  [Messenger.TELEGRAM]: 'Telegram',
  [Messenger.DISCORD]: 'Discord',
};

export function getLabelOfMessenger(messenger: Messenger | string): string {
  return messengerTypeNames[messenger];
}

export function getLabelOfActionType(actionType: ActionType | string): string {
  return actionTypeNames[actionType];
}

export class Action {
  @ApiPropertyOptional({ enum: Object.values(Messenger) })
  @IsInOrNull(Object.values(Messenger))
  messenger?: Messenger;
  @ApiProperty({ enum: Object.values(ActionType) })
  @IsIn(Object.values(ActionType))
  @IsString()
  @ApiProperty()
  type: ActionType;
  @ApiPropertyOptional()
  @IsStringOrNull()
  value?: string;
}

@Injectable()
export class AppService {
  private async readActions(): Promise<Action[]> {
    try {
      const actions = JSON.parse(
        (
          await readFile(process.env.ACTION_FILE || 'actions.json', {
            encoding: 'utf-8',
          })
        ).toString(),
      );
      return actions;
    } catch (e) {
      return [];
    }
  }
  async writeActions(actions: Action[]) {
    try {
      await writeFile(
        process.env.ACTION_FILE || 'actions.json',
        JSON.stringify(actions, null, 2),
        { encoding: 'utf-8' },
      );
    } catch (e) {}
  }
  async getAllActions(): Promise<Action[]> {
    return await this.readActions();
  }
  async addAction(action: Action) {
    const actions = await this.getAllActions();
    actions.push(action);
    await this.writeActions(actions);
  }
  async deleteActions() {
    await this.writeActions([]);
  }
  async getReportData() {
    const actions = await this.readActions();
    const sortByMessenger = {};
    actions.forEach((action) => {
      if (!action.messenger) {
        if (!sortByMessenger['global'] && action.value)
          sortByMessenger['global'] = [];
        if (action.value) sortByMessenger['global'].push(action.value);
      } else {
        let type = sortByMessenger[action.messenger];
        if (!type) type = {};
        if (!type[action.type])
          type[action.type] = action.type !== ActionType.NOTE ? 0 : [];
        if (action.type !== ActionType.NOTE) type[action.type]++;
        else type[action.type].push(action.value);
        sortByMessenger[action.messenger] = type;
      }
    });
    return sortByMessenger;
  }
  async getReport() {
    const data = (await this.getReportData()) as any;
    let str = '';
    let globals = null;
    for (const key1 of Object.keys(data)) {
      if (key1 === 'global') {
        globals = data[key1];
      } else {
        const m = data[key1];
        str += '<b>' + getLabelOfMessenger(key1) + ':</b><br />\n';
        for (const key2 of Object.keys(m).sort((a, b) => {
          if (a === ActionType.NOTE) return 1;
          if (b == ActionType.NOTE) return -1;
          else return 0;
        })) {
          const value = m[key2];
          if (key2 === ActionType.NOTE) {
            str += getLabelOfActionType(key2) + ':<br /><ul>';
            value.forEach((e) => {
              str += '<li>' + e + '</li>\n';
            });
            str += '</ul>\n';
          } else str += getLabelOfActionType(key2) + ': ' + value + '<br />\n';
        }
      }
    }
    if (globals) {
      str += '<br/>\n<b>Weiteres: </b><ul>\n';
      for (const note of globals) {
        str += '<li>' + note + '</li>\n';
      }
      str += '</ul>';
    }
    return str;
  }
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON)
  async uploadReport() {
    console.log(await this.getReport());
  }
}

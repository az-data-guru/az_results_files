import { MysqlService } from './mysql.service';
import { connection } from './connection';
import * as moment from 'moment-timezone';

async function start() {
    const mysql: MysqlService = new MysqlService(connection);
    await mysql.createDatabaseConnection();
    const timestamps = {};
    const rows = await mysql.query('SELECT * FROM edison_raw', []);
    const results = [];
    for (const row of rows) {
        results.push([
            row.State_last_updated,
            row.County,
            row.Trump_Absentee,
            row.Trump_Votes - row.Trump_Absentee,
            -1,  // No data for this section, so explicitly setting to -1
            row.Trump_Votes,
            row.Biden_Absentee,
            row.Biden_Votes - row.Biden_Absentee,
            -1,  // No data for this section, so explicitly setting to -1
            row.Biden_Votes,
            -1,  // No data for this section, so explicitly setting to -1
            -1,  // No data for this section, so explicitly setting to -1
            -1,  // No data for this section, so explicitly setting to -1
            -1,  // No data for this section, so explicitly setting to -1
        ]);
    }
    await mysql.query('INSERT INTO edison_normalized (report_time, jurisdiction,trump_early,trump_election_day,trump_provisional,trump_total,biden_early,biden_election_day,biden_provisional,biden_total,other_early,other_election_day,other_provisional,other_total) VALUES ?', [results]);
    process.exit(0);
}

start();
import { MysqlService } from './mysql.service';
import { connection } from './connection';
import * as moment from 'moment-timezone';

async function start() {
    const mysql: MysqlService = new MysqlService(connection);
    await mysql.createDatabaseConnection();
    const timestamps = {};
    const rows = await mysql.query('SELECT * FROM sos_raw WHERE contest_key = "3509" ORDER BY report_time ASC', []);
    for (const row of rows) {
        const report_time = moment.utc(row.report_time).add(2, 'hours').format('YYYY-MM-DDTHH:mm:ss');
        if (!timestamps[report_time]) {
            timestamps[report_time] = {
                [row.jurisdiction_name]: {
                    [row.choice_name]: {
                        total_votes: row.jurisdiction_total_votes,
                        election_day: row.election_day_votes,
                        early_ballot: row.early_ballot_votes,
                        provisional_ballot: row.provisional_votes,
                    }
                }
            };
        }
        else {
            if (timestamps[report_time][row.jurisdiction_name]) {
                timestamps[report_time][row.jurisdiction_name] = Object.assign(timestamps[report_time][row.jurisdiction_name], {
                    [row.choice_name]: {
                        total_votes: row.jurisdiction_total_votes,
                        election_day: row.election_day_votes,
                        early_ballot: row.early_ballot_votes,
                        provisional_ballot: row.provisional_votes,
                    }
                });
            }
            else {
                timestamps[report_time] = Object.assign(timestamps[report_time], {
                    [row.jurisdiction_name]: {
                        [row.choice_name]: {
                            total_votes: row.jurisdiction_total_votes,
                            election_day: row.election_day_votes,
                            early_ballot: row.early_ballot_votes,
                            provisional_ballot: row.provisional_votes,
                        }
                    }
                })
            }
        }
    }
    const results = [];
    for (const time in timestamps) {
        for (const jurisdiction in timestamps[time]) {
            const result = {
                report_time: time,
                jurisdiction: jurisdiction,
                trump_early: timestamps[time][jurisdiction]['Trump, Donald J.'].early_ballot,
                trump_election_day: timestamps[time][jurisdiction]['Trump, Donald J.'].election_day,
                trump_provisional: timestamps[time][jurisdiction]['Trump, Donald J.'].provisional_ballot,
                trump_total: timestamps[time][jurisdiction]['Trump, Donald J.'].total_votes,
                biden_early: timestamps[time][jurisdiction]['Biden, Joseph'].early_ballot,
                biden_election_day: timestamps[time][jurisdiction]['Biden, Joseph'].election_day,
                biden_provisional: timestamps[time][jurisdiction]['Biden, Joseph'].provisional_ballot,
                biden_total: timestamps[time][jurisdiction]['Biden, Joseph'].total_votes,
                other_early: 0,
                other_election_day: 0,
                other_provisional: 0,
                other_total: 0,
            };
            result.other_early =
                timestamps[time][jurisdiction]['Jorgensen, Jo'].early_ballot +
                timestamps[time][jurisdiction]['Hawkins, Howie'].early_ballot +
                timestamps[time][jurisdiction]['Boddie, President R.'].early_ballot +
                timestamps[time][jurisdiction]['La Riva, Gloria'].early_ballot +
                timestamps[time][jurisdiction]['Cummings, Daniel Clyde'].early_ballot +
                timestamps[time][jurisdiction]['Simmons, Jade'].early_ballot;
            result.other_election_day =
                timestamps[time][jurisdiction]['Jorgensen, Jo'].election_day +
                timestamps[time][jurisdiction]['Hawkins, Howie'].election_day +
                timestamps[time][jurisdiction]['Boddie, President R.'].election_day +
                timestamps[time][jurisdiction]['La Riva, Gloria'].election_day +
                timestamps[time][jurisdiction]['Cummings, Daniel Clyde'].election_day +
                timestamps[time][jurisdiction]['Simmons, Jade'].election_day;
            result.other_provisional =
                timestamps[time][jurisdiction]['Jorgensen, Jo'].provisional_ballot +
                timestamps[time][jurisdiction]['Hawkins, Howie'].provisional_ballot +
                timestamps[time][jurisdiction]['Boddie, President R.'].provisional_ballot +
                timestamps[time][jurisdiction]['La Riva, Gloria'].provisional_ballot +
                timestamps[time][jurisdiction]['Cummings, Daniel Clyde'].provisional_ballot +
                timestamps[time][jurisdiction]['Simmons, Jade'].provisional_ballot;
            result.other_total =
                timestamps[time][jurisdiction]['Jorgensen, Jo'].total_votes +
                timestamps[time][jurisdiction]['Hawkins, Howie'].total_votes +
                timestamps[time][jurisdiction]['Boddie, President R.'].total_votes +
                timestamps[time][jurisdiction]['La Riva, Gloria'].total_votes +
                timestamps[time][jurisdiction]['Cummings, Daniel Clyde'].total_votes +
                timestamps[time][jurisdiction]['Simmons, Jade'].total_votes;
            results.push([
                result.report_time,
                result.jurisdiction,
                result.trump_early,
                result.trump_election_day,
                result.trump_provisional,
                result.trump_total,
                result.biden_early,
                result.biden_election_day,
                result.biden_provisional,
                result.biden_total,
                result.other_early,
                result.other_election_day,
                result.other_provisional,
                result.other_total,
            ]);
        }
    }
    await mysql.query('INSERT INTO sos_normalized (report_time, jurisdiction,trump_early,trump_election_day,trump_provisional,trump_total,biden_early,biden_election_day,biden_provisional,biden_total,other_early,other_election_day,other_provisional,other_total) VALUES ?', [results]);
    process.exit(0);
}

start();
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { has } from 'lodash';
import { MysqlService } from './mysql.service';
import { connection } from './connection';

fs.readdir('../azsos', async (err, files) => {
    const mysql: MysqlService = new MysqlService(connection);
    await mysql.createDatabaseConnection();
    for (const file of files) {
        const data = fs.readFileSync(`../azsos/${file}`);
        const $ = cheerio.load(data.toString('utf-8'));
        const results = {};
        const contestNames = {};
        for (const contest of $('contests').children()) {
            const $contest = $(contest);
            if (!has(contestNames, $contest.attr('key'))) {
                contestNames[$contest.attr('key')] = {
                    name: $contest.attr('contestlongname'),
                    district: $contest.attr('districtkey'),
                    district_name: $contest.attr('districtname'),
                    is_question: $contest.attr('isquestion') === 'true' ? 1 : 0,
                };
            }
            const choiceNames = {};
            for (const choice of $contest.find('choices').children()) {
                const $choice = $(choice);
                if (choiceNames[$choice.attr('key')]) {
                    throw new Error('Duplicate choice')
                }
                else {
                    const votes = [];
                    for (const jurisdiction of $choice.find('jurisdictions').children()) {
                        const $jurisdiction = $(jurisdiction);
                        const jurisdictionVotes = {};
                        for (const voteType of $jurisdiction.find('votetypes').children()) {
                            const $voteType = $(voteType);
                            switch ($voteType.attr('votetypename')) {
                                case 'Polling Place':
                                    jurisdictionVotes['election_day'] = $voteType.attr('votes');
                                    break;
                                case 'Early Ballots':
                                    jurisdictionVotes['early_ballots'] = $voteType.attr('votes');
                                    break;
                                case 'Provisional Ballots':
                                    jurisdictionVotes['provisional'] = $voteType.attr('votes');
                                    break;
                            }
                        }
                        votes.push(Object.assign({
                            name: $jurisdiction.attr('name'),
                            key: $jurisdiction.attr('key'),
                            total_votes: $jurisdiction.attr('votes'),
                        }, jurisdictionVotes));
                    }
                    choiceNames[$choice.attr('key')] = {
                        name: $choice.attr('choicename'),
                        is_write_in: $choice.attr('iswritein'),
                        party: $choice.attr('party'),
                        party_key: $choice.attr('partykey'),
                        total_votes: $choice.attr('totalvotes'),
                        votes: votes
                    };
                }
            }
            results[$contest.attr('key')] = choiceNames;
        }
        await saveData({
            report_time: $('resultstimestamp').text(),
            filename: file,
            file_id: $('fileid').text(),
        }, results, contestNames, mysql);
    }
    process.exit(0)
});

async function saveData(metadata: any, data: any, contestNames, mysql: MysqlService) {
    const results = [];
    for (const contestKey in data) {
        for (const optionKey in data[contestKey]) {
            for (const jurisdictionVotes of data[contestKey][optionKey].votes) {
                results.push([
                    metadata.filename,
                    metadata.report_time,
                    metadata.file_id,
                    contestKey,
                    contestNames[contestKey].name,
                    contestNames[contestKey].district,
                    contestNames[contestKey].district_name,
                    contestNames[contestKey].is_question,
                    jurisdictionVotes.key,
                    jurisdictionVotes.name,
                    jurisdictionVotes.total_votes,
                    jurisdictionVotes.election_day,
                    jurisdictionVotes.provisional,
                    jurisdictionVotes.early_ballots,
                    data[contestKey][optionKey].total_votes,
                    optionKey,
                    data[contestKey][optionKey].name,
                    data[contestKey][optionKey].is_write_in,
                    data[contestKey][optionKey].party,
                    data[contestKey][optionKey].party_key,
                ]);
            }
        }
    }
    await mysql.query(`INSERT INTO sos_raw 
        (
            filename,
            report_time,
            file_id,
            contest_key,
            contest_name,
            district_key,
            district_name,
            is_question,
            jurisdiction_key,
            jurisdiction_name,
            jurisdiction_total_votes,
            election_day_votes,
            provisional_votes,
            early_ballot_votes,
            choice_total_votes,
            choice_key,
            choice_name,
            choice_is_write_in,
            choice_party,
            choice_party_key
        ) VALUES ?`, [results]);
}
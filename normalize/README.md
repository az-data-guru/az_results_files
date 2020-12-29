# Normalization instructions

The purpose of these scripts is to:

1)  Take the raw data from the azsos files and insert them into a MySQL database
2)  Normalize that table (sos_raw into sos_normalized)
3)  Take the raw Edison data (edison_raw) and normalize that (edison_normalized)
4)  Be able to compare the columns apples-to-apples


## Step 1

Ingest the edison_raw.sql file into your MySQL database

## Step 2

With node installed on a machine, run `npm install` in this folder

## Step 3

Rename the `connection.example.ts` file to `connection.ts` and fill in the appropriate connection details for your MySQL database

## Step 4

Run `ts-node azsos-to-mysql.ts`

## Step 5

Run `ts-node azsos-normalize.ts`

## Step 6

Run `ts-node edison-normalize.ts`
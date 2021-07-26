from pandas import read_csv
# load data

dataset = read_csv('covid_colombia.csv', index_col=0)
# manually specify column names
dataset.index.name = 'Date'
# summarize first 5 rows
print(dataset.head(5))
# save to file
dataset.to_csv('covid_santa_marta.csv')
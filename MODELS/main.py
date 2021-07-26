from lstm import evalLSTM
from bilstm import  evalBiLSTM
from gru import evalGRU
from rnn import  evalRNN
from data import DataAnalyzer
from matplotlib import pyplot as plt

modelData = DataAnalyzer('covid_santa_marta.csv')
data,scaler = modelData.transformData()

sampleSize = 365
epochs = 100
units = 8

actual, lstm = evalLSTM(data, scaler, sampleSize, epochs, units).forecast()
rnn = evalRNN(data, scaler, sampleSize, epochs, units).forecast()
gru = evalGRU(data, scaler, sampleSize, epochs, units).forecast()
bilstm = evalBiLSTM(data, scaler, sampleSize, epochs, units).forecast()

plt.plot(actual, label='actual')
plt.plot(lstm, label='LSTM')
plt.plot(rnn, label='RNN')
plt.plot(gru, label='GRU')
plt.plot(bilstm, label='BiLSTM')
plt.title('Models evaluation')
plt.xlabel('Days')
plt.ylabel('Confirmed cases')
plt.legend()
plt.show()
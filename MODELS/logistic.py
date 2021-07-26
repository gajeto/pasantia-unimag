import math
import numpy as np
import pandas as pd
import scipy.optimize as optim
import matplotlib.pyplot as plt

data = pd.read_csv('covid_santa_marta.csv', sep=',')
data = data['Confirmed']
data = data[:50]
data = data.reset_index(drop=False)
data.columns = ['Timestep', 'Total Cases']
#print(data.head(10))

def logistic(t, a, b, c):
    return c / (1 + a * np.exp(-b*t))

p0 = np.random.exponential(size=3)
bounds = (0, [10000., 4., 100000000.])

x = np.array(data['Timestep']) + 1
y = np.array(data['Total Cases'])

(a,b,c),cov = optim.curve_fit(logistic, x, y, bounds=bounds, p0=p0)
print(a,b,c)

def logistic(t):
    return c / (1 + a * np.exp(-b*t))

t_fastest = np.log(a) / b
cap = logistic(t_fastest)
print('t_fast', t_fastest)
print('cap', cap)

plt.scatter(x, y)
plt.plot(x, logistic(x))
plt.title('Logistic Model vs Real Observations of Santa Marta Coronavirus')
plt.legend([ 'Logistic', 'Real data'])
plt.xlabel('Days')
plt.ylabel('Confirmed cases')
plt.show()
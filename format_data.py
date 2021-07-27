import sys
import os
import pandas as pd
import numpy as np
import unicodedata
import tkinter as tk
from tkinter import filedialog
import matplotlib.pyplot as plt
from datetime import datetime

from pyparsing import unicode


def cretate_dfTemp_plot(df):

    dates = df['fis'].tolist()
    vals = df['N_infectados'].tolist()
    inputLen = len(vals)

    result = []
    # for (int i = 0; i < inputLen; i++)
    # result[i / n] = dates[i];

    y = [sum(vals[i:i+7]) for i in range(0, len(vals), 7)]
    x = [str(dates[i]) for i in range(0, len(vals), 7)]
    # datetime.strftime
    #plt.bar(range(0, len(temp), 1), temp)

    fig, ax = plt.subplots()
    width = 0.75  # the width of the bars
    ind = np.arange(len(y))  # the x locations for the groups
    ax.barh(ind, y, width)
    ax.set_yticks(ind+width/2)
    ax.set_yticklabels(x, minor=False)
    plt.title('Casos reoportados acumulados cada 7 dias')
    plt.xlabel('No. de casos')
    plt.ylabel('Fechas')

    for i, v in enumerate(y):
        ax.text(v + 3, i + .25, str(v), color='blue', fontweight='bold')

    plt.show()


def create_df_required(df, study_name):

    df['fis'] = df['fecha_de_inicio_de_sintomas'].str.normalize('NFKD').str.encode(
        'ascii', errors='ignore').str.decode('utf-8')  # Elimina tilde de asintomatico
    df['fis'] = df['fis'].replace('Asintomatico', np.nan)
    # A los asintomaticos le coloca como fecha fis la fecha de diagnostico
    df['fis'] = df['fis'].fillna(df['fecha_de_diagnostico'])
    # print(list(set(list(df["fis"]))))
    df['fis'] = pd.to_datetime(df['fis'], format='%d/%m/%Y %H:%M:%S')
    print(list(set(list(df["fis"]))))

    grouped_df = df.groupby(['fis'])
    df2 = pd.DataFrame(grouped_df.size().reset_index(name="N_infectados"))
    df2['Confirmados'] = df2['N_infectados'].cumsum()
    # print(df2)
    # ----------------------------------------------------
    # No. de casos fallecidos
    df['fecha_de_muerte'] = df['fecha_de_muerte'].replace('-   -', np.nan)
    #df['fecha_de_muerte'] = pd.to_datetime(df['fecha_de_muerte'])
    df['fecha_de_muerte'] = pd.to_datetime(
        df['fecha_de_muerte'], format='%d/%m/%Y %H:%M:%S')
    grouped_df = df.groupby(['fecha_de_muerte'])
    df3 = pd.DataFrame(grouped_df.size().reset_index(name="N_Fallecidos"))
    df3['N_Fallecidos'] = df3['N_Fallecidos'].fillna(0)
    df3['Fallecidos'] = df3['N_Fallecidos'].cumsum()
    # print(df3)
    # ----------------------------------------------------
    df['fecha_recuperado'] = df['fecha_de_recuperacion'].replace(
        '-   -', np.nan)
    df['fecha_recuperado'] = pd.to_datetime(
        df['fecha_recuperado'], format='%d/%m/%Y %H:%M:%S')
    grouped_df = df.groupby(['fecha_recuperado'])
    df4 = pd.DataFrame(grouped_df.size().reset_index(name="N_Recuperados"))
    df4['N_Recuperados'] = df4['N_Recuperados'].fillna(0)
    df4['Recuperados'] = df4['N_Recuperados'].cumsum()
    # print(df4)
    # ----------------------------------------------------
    df5 = pd.merge(df2, df3, left_on=['fis'], right_on=[
                   'fecha_de_muerte'], how="outer")

    df5['fis'] = df5['fis'].combine_first(df5['fecha_de_muerte'])

    df6 = pd.merge(df5, df4, left_on=['fis'], right_on=[
                   'fecha_recuperado'], how="outer")
    df6['fis'] = df6['fis'].combine_first(df6['fecha_recuperado'])

    df6['N_infectados'] = df6['N_infectados'].fillna(0)
    df6['N_Fallecidos'] = df6['N_Fallecidos'].fillna(0)
    df6['N_Recuperados'] = df6['N_Recuperados'].fillna(0)

    df6['Fallecidos'] = df6['Fallecidos'].fillna(0)
    df6['Recuperados'] = df6['Recuperados'].fillna(0)
    df6 = df6.sort_values('fis')

    # print(df6[['N_infectados']])

    #df6.hist(column = 'N_infectados', bins=7)
    # plt.show()

    #print(df6['N_infectados'].rolling(min_periods=1, window=7).sum())

    cretate_dfTemp_plot(df6[['fis', 'N_infectados']])

    df6['Confirmados'] = df6['N_infectados'].cumsum()
    df6['Fallecidos'] = df6['N_Fallecidos'].cumsum()
    df6['Recuperados'] = df6['N_Recuperados'].cumsum()

    #df6.plot.bar(x = 'fis', y = ['N_infectados'])

    df6 = df6.drop(['fecha_de_muerte', 'fecha_recuperado'], axis=1)

    # print(df6)

    # ----------------------------------------------------
    df6['Province'] = study_name
    df6['Country'] = study_name

    dff = df6[['fis', 'Province', 'Country', 'Confirmados',
               'Fallecidos', 'Recuperados', 'N_infectados']]
    dff.columns = ['ObservationDate',	'Province/State',
                   'Country/Region', 'Confirmed', 'Deaths', 'Recovered', 'N_infectados']

    return dff
    # print(dff)


def strip_accents(text):
    """
    Strip accents from input String.

    :param text: The input string.
    :type text: String.

    :returns: The processed String.
    :rtype: String.
    """
    try:
        text = unicode(text, 'utf-8')
    except (TypeError, NameError):  # unicode is a default on python 3
        pass
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore')
    text = text.decode("utf-8")
    return str(text)


def additional_format(raw):

    data_cols_all = ["Confirmed", "Infected", "Deaths", "Recovered"]

    df = raw.rename({"ObservationDate": "Date",
                    "Province/State": "Province", "Country/Region": "Country"}, axis=1)
    # print(set(list(df["Date"])))
    df["Date"] = pd.to_datetime(df["Date"])

    df["Infected"] = df["Confirmed"] - df["Deaths"] - df["Recovered"]

    df[data_cols_all] = df[data_cols_all].astype(np.int64)

    ncov_df_ungrouped = df[["Date", "Country", "Province",
                            "Confirmed", "Infected", "Deaths", "Recovered"]]

    return ncov_df_ungrouped


def eliminar_caracteres_especiales_col(columnas):

    l = list(columnas)
    # print(l)
    for i in range(0, len(l)):
        l[i] = str(l[i]).translate({ord(j): None for j in "(),',-"})
        l[i] = l[i].lower()
        if l[i][-1] == " ":
            l[i] = "" + l[i][:-1:]
        l[i] = strip_accents(l[i])
        l[i] = l[i].replace(' ', '_')
    return l

def download_csv(url):
    return pd.read_csv(url)

if __name__ == "__main__":
    """   
    file_path = "Casos_positivos_de_COVID-19_en_Colombia.csv"
    dfi = pd.read_csv(file_path)
    """
    url = "https://www.datos.gov.co/api/views/gt2j-8ykr/rows.csv?accessType=DOWNLOAD"
    dfi = download_csv(url)

    dfi.columns = eliminar_caracteres_especiales_col(dfi.columns)
    # print(list(dfi.columns))

    df = dfi.loc[dfi['nombre_municipio'] == 'SANTA MARTA']
    df = df[['fecha_de_inicio_de_sintomas', 'fecha_de_diagnostico',
             'fecha_de_recuperacion', 'fecha_de_muerte']]

    df_stMarta = create_df_required(df, 'StaMarta')

    df_stMarta = additional_format(df_stMarta)

    df_stMarta.to_csv('covid_colombia.csv')

    # print(df['fis'].head(100))

FROM postgres:10.0

ENV POSTGRES_USER postgres
ENV POSTGRES_PASSWORD postgres
ENV POSTGRES_DB inventory

COPY ./db/schema.sql /docker-entrypoint-initdb.d
